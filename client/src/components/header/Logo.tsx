import React from "react";

const Logo: React.FC<{ className?: string }> = (props) => {
  return (
    <span className={(props.className || "") + " traineeLogo"}>
      Trai<div>n</div>e<div>e</div>
    </span>
  );
};

export default Logo;
