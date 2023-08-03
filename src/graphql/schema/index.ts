import {
  DocumentNode,
  FieldDefinitionNode,
  GraphQLError,
  GraphQLSchema,
  Kind,
  ObjectTypeDefinitionNode,
  buildASTSchema,
  parse
} from "graphql";
import type { IErrorResponse } from "../../helpers/errorHelpers";
import path from "path";
import fs from "fs";

import "./customTypes";
import { GraphQlPlugin } from "..";


/// these must be in sync with GraphQl schema
export interface IGraphQl_BaseResponse {}

export interface IGraphQl_Response {
  success: boolean;
  __typename: string;
}

export interface IGraphQl_ErrorResponse
  extends IGraphQl_Response,
    IErrorResponse {
  success: false;
}

export interface IGraphQl_OkResponse extends IGraphQl_Response {
  success: true;
  nrAffected: number;
  ids?: number[];
}

export type IGraphQl_MutationResponse =
  | IGraphQl_OkResponse
  | IGraphQl_ErrorResponse;


/**
 * Gets the GraphQlSchemas
 * @returns {GraphQLSchema}
 */
export function getGraphQlSchema() {
  return schema;
}

/**
 * Initalizes GraphQlSchemas
 * @returns {GraphQLSchema}
 */
export function initGraphQlSchema(graphQlPlugins: GraphQlPlugin[], log=false) {
  if (schema) return schema;
  const sdlFiles = graphQlPlugins.map(
    p=>p.sdlFiles.map(
      f=>{return {file:path.join(p.schemaDir, f), plugin:p}}
    )
  ).flat();

  const docs = sdlFiles.map(f=>loadSdlFile(f));
  const merged = mergeSdlDocs(docs,log);

  schema = buildASTSchema(merged);

  return schema;
}


// -------------------------------------------------------
// only testing things
export const clearGraphQlSchemas = process.env.NODE_ENV !== 'test' ?
  ()=>{ throw new Error('Just for testing') } :
  ()=>{
    schema = undefined;
  }

// --------------------------------------------------------
// sdl plugin stuff and loading sdl files and merge them to one doc


type SdlDocObj = {
  doc:DocumentNode,
  file:string,
  plugin: GraphQlPlugin,
}


// global schema
let schema: GraphQLSchema | undefined;

// load a SDL file and parse it to a document
function loadSdlFile(
  {file, plugin}: {file:string, plugin:GraphQlPlugin}
):
  SdlDocObj
{
  try {
    const sdl = fs.readFileSync(file);
    const doc = parse(sdl+"")
    return {doc,file, plugin};

  } catch (e) {
    if (e instanceof GraphQLError) {
      console.error({
        message:e.message,
        locations:[{
          file,
          ...(e.locations ? e.locations[0]: undefined),
        }],
        stack: e.stack,
        error: e
      })
    } else  {
      console.error(`${e} loading file ${file}`)
    }

    throw e;
  }
}

// merge many sdl files to single document
function mergeSdlDocs(sdlObjs: SdlDocObj[], log:boolean) {
  const clone = (doc: DocumentNode) => {
    return {
      definitions: doc.definitions.map(d=>structuredClone(d)),
      kind: structuredClone(doc.kind),
      loc:structuredClone(doc.loc)
    };
  }
  const root = clone(sdlObjs[0].doc);
  const finder = (lookFor:string) => {
    return (def:any)=>{
      return (
        def.kind === Kind.OBJECT_TYPE_DEFINITION &&
        def.name.value === lookFor);
    }
  }

  const moveToFactory = (action: string) => {
    const rootObj = root.definitions.find(finder(action)) as
      ObjectTypeDefinitionNode;
    return (def: ObjectTypeDefinitionNode, sdlObj: SdlDocObj) => {
      if (!rootObj)
        throw new Error(
          `SDL error ${action} not supported, `+
          `from file: ${sdlObj.file}`);

      (rootObj.fields as FieldDefinitionNode[]).push(
        ...(def.fields || [])
      )
    }
  }

  const moveToQuery = moveToFactory('Query'),
        moveToMutation = moveToFactory('Mutation'),
        moveToSubscription = moveToFactory('Subscription');

  const route = (
    def: ObjectTypeDefinitionNode,
    typeName: string,
    sdlObj: SdlDocObj
  ) => {

    switch (typeName) {
      // Move these to root Action
      case 'Query': moveToQuery(def,sdlObj); return true;
      case 'Mutation': moveToMutation(def,sdlObj); return true;
      case 'Subscription': moveToSubscription(def,sdlObj); return true;
      // else dont move these
      default: return false;
      }
  }

  for (let i = 1; i<sdlObjs.length; ++i) {
    const prefix = sdlObjs[i].plugin.prefix;
    const doc = structuredClone(sdlObjs[i].doc);

    for (const def of doc.definitions) {
      const name = (def as any).name.value ;


      if (def.kind === Kind.OBJECT_TYPE_DEFINITION) {
        // all none global sdl parts
        if (prefix) { // global has no prefix
          if (!name.startsWith(`${prefix}_`)) {
            throw new Error(
              `Rule '${name}' must be prefixed with `+
              `'${prefix}_' in ${sdlObjs[i].file}`);
          }

          const parts = name.match(
            new RegExp(`^${prefix}_([a-zA-A]+)_([a-zA-Z]+)$`));
          const namespace = parts?.at(1),
                typeName = parts?.at(2);

          // is it a root type?
          if (namespace && typeName &&
              route(def as ObjectTypeDefinitionNode, typeName, sdlObjs[i]))
          {
            continue;
          }

        // all global root actions
        } else {
          if (route(def as ObjectTypeDefinitionNode, name, sdlObjs[i]))
          {
            continue;
          }
        }
      }

      root.definitions.push(def);
    }
  }

  if (log) {
    console.log('SDL root actions:')
    for (const def of root.definitions as any[]) {
      if (def.fields ||['Query','Mutation'].indexOf(def.name?.value)>-1) {
        console.log(' '+def.name?.value);
        for (const fld of def.fields as any) {
          console.log('  '+fld.name.value);
        }
      }
    }
  }

  return root;
}
