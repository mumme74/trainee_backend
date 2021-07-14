import React, { useEffect } from "react";

import Unauthorized from "../Unauthorized";
import { isAuthenticated, myUserRoles } from "../../helpers";

export function withAuthGuardCommon(
  OriginalComponent: React.ComponentType<any | string>,
  roles?: [string]
) {
  const MixedComponent = (props: any) => {
    // if we have roles we must check against them, else we only check that isAhtenticated
    const roleCheck = roles
      ? myUserRoles().find((role) => roles.includes(role))
      : true;
    if (isAuthenticated() && roleCheck) {
      return <OriginalComponent {...props} />;
    } else {
      console.log("user is not authenticated");
      return <Unauthorized requiredRoles={roles} />;
    }
  };

  return MixedComponent;
}

export function withAuthGuardStudent(
  OriginalComponent: React.ComponentType<any | string>
) {
  return withAuthGuardCommon(OriginalComponent, ["student"]);
}

export function withAuthGuardTeacher(
  OriginalComponent: React.ComponentType<any | string>
) {
  return withAuthGuardCommon(OriginalComponent, ["teacher"]);
}

export function withAuthGuardAdmin(
  OriginalComponent: React.ComponentType<any | string>
) {
  return withAuthGuardCommon(OriginalComponent, ["admin"]);
}

export function withAuthGuardSuperAdmin(
  OriginalComponent: React.ComponentType<any | string>
) {
  return withAuthGuardCommon(OriginalComponent, ["super"]);
}
