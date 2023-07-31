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



/// these must be in sync with GraphQl schema
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

// --------------------------------------------------------
// sdl plugin stuff and loading sdl files and merge them to one doc

/**
 * The type to add to registerSdlPlugin
 */
export type SdlPluginType = {
  name: string,
  description?: string,
  prefix: string,
  rootDir: string,
  sdlFiles: string[]
}

type SdlDocObj = {
  doc:DocumentNode,
  file:string,
  plugin: SdlPluginType,
}

// global schema
let schema: GraphQLSchema;

// holds all SDL plugins registered to system
const sdlPlugins: SdlPluginType[] = [];

/**
 * Registers a Sdl plugin to system
 * Muust be called before initGraphQlSchema is called
 * @param plugin
 */
export function registerSdlPlugin(plugin: SdlPluginType) {
  if (!plugin.name)
    throw new Error('SdlPlug must have a name');
  if (!plugin.rootDir)
    throw new Error('Sdlplugin must have a rootDir');
  if (schema)
    throw new Error(
      "Cant add SdlPlugin after initGraphqlSchema() is called ");
  if (!plugin.sdlFiles.length) {
    plugin.sdlFiles.push(
      ...fs.readdirSync(plugin.rootDir).filter(f=>f.endsWith('.graphql')));
  }
  sdlPlugins.push(plugin);
}

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
export function initGraphQlSchema() {
  if (schema) return schema;
  const sdlFiles = sdlPlugins.map(
    p=>p.sdlFiles.map(
      f=>{return {file:path.join(p.rootDir, f), plugin:p}}
    )
  ).flat();

  const docs = sdlFiles.map(f=>loadSdlFile(f));
  const merged = mergeSdlDocs(docs);

  schema = buildASTSchema(merged);

  return schema;
}

// load a SDL file and parse it to a document
function loadSdlFile(
  {file, plugin}: {file:string, plugin:SdlPluginType}
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

    process.exit(1)
  }
}

// merge many sdl files to single document
function mergeSdlDocs(sdlObjs: SdlDocObj[]) {
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
  const rootQuery = root.definitions.find(finder('Query')) as
                        ObjectTypeDefinitionNode,
        rootMutation = root.definitions.find(finder('Mutation')) as
                        ObjectTypeDefinitionNode,
        rootSubscription = root.definitions.find(finder('Subscription')) as
                        ObjectTypeDefinitionNode;

  const moveTo = (
    rootObj: ObjectTypeDefinitionNode,
    def: ObjectTypeDefinitionNode
  ) => {
    (rootObj.fields as FieldDefinitionNode[]).push(
      ...(def.fields || [])
    );
  };

  for (let i = 1; i<sdlObjs.length; ++i) {
    const prefix = sdlObjs[i].plugin.prefix;
    const doc = structuredClone(sdlObjs[i].doc);

    for (const def of doc.definitions) {
      if (def.kind === Kind.OBJECT_TYPE_DEFINITION &&
          prefix && // global has no prefix
          def.name.value.startsWith(`${prefix}_`))
      {
        const parts = def.name.value.match(
          new RegExp(`^${prefix}_([a-zA-A]+)_([a-zA-Z]+)$`));
        const namespace = parts?.at(1),
              typeName = parts?.at(2);
        // is it a root type?
        if (namespace && typeName) {
          switch (typeName) {
          case 'Query': moveTo(rootQuery,def); continue;// Dont move to doc
          case 'Mutation': moveTo(rootQuery,def); continue;// Dont move to doc
          case 'Subscription': moveTo(rootQuery,def); continue;// Dont move to doc
          default: void 0;
          }
        }
      }

      root.definitions.push(def);
    }
  }

  return root;
}

// read global graphql files
const globalSdlFiles = fs.readdirSync(__dirname)
  .filter(f=>f.endsWith('.graphql'));

const globalPlugin: SdlPluginType = {
  name: 'Global',
  description: 'The global graphql plugin',
  prefix: '',
  rootDir: __dirname,
  sdlFiles: [...globalSdlFiles]
}
registerSdlPlugin(globalPlugin);


// read core graphql files
const coreSdlFiles = fs.readdirSync(path.join(__dirname, 'core'))
         .filter(f=>f.endsWith('.graphql'));
if (['test', 'development'].indexOf(""+process.env.NODE_ENV) === -1) {
  let idx: number;
  while ((idx = coreSdlFiles.findIndex(p=>p.startsWith('testing')))
         && idx > -1 )
  {
    if (idx ===undefined || idx < 0) break;
    coreSdlFiles.splice(idx, 1);
  }
}
const corePlugin: SdlPluginType = {
  name: 'Core',
  description: 'The core to the system, user, group handling and such',
  prefix: 'core',
  rootDir: path.join(__dirname, 'core'),
  sdlFiles: coreSdlFiles
}
registerSdlPlugin(corePlugin);
