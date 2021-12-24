import React, { useState, useEffect } from "react";
 
const RerenderDebug = () => {
 const [color, setColor] = useState("#000");
 
 useEffect(() => {
   setColor("#" + (((1 << 24) * Math.random()) | 0).toString(16));
 }, []);
  return <span style={{ background: color }}>{color}</span>;
};
 
export default RerenderDebug;