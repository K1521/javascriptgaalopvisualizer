import * as graph2 from "./graph2.js"

import fs from 'fs';


class polynom{
    constructor(){
        /** 
         * @type {Map<GraphNode,GraphNode>} 
         * polybasis->coefficient expression
        */
        this.coefficients=new Map();
    }
}




let path="./jsfromgraph/torus_intersect.json";
//var fs = require('fs');
fs.readFile(path, 'utf8', (err, data) => {


    if (err) {
        console.error(err);
        return;
    }

    const graph=new graph2.GaalopGraph();
    graph.fromjson(data);


    let objectstovisualize=new Map();
    for (const [innerProductResultName,outputMultivectorName] of graph.renderingExpression.entries()) {
        const innerProductResultMV=graph.outputMultivectors.get(innerProductResultName);
        const objtovisualizeMV=graph.outputMultivectors.get(outputMultivectorName);


        objectstovisualize.set(outputMultivectorName,{
            name:outputMultivectorName,
            input:objtovisualizeMV,
            output:innerProductResultMV
        })
    }

    let {input,output}=objectstovisualize.get("intersect");


    console.log(output);
    let outputset=new Set(output.values());
    let inputset=new Set(input.values());



    //for(const node of input.values())node.operand.value=666


    console.log([...output.values()].length)
    let simplified=graph2.commonsubexpressionelimination(output.values());
    console.log([...simplified.values()].length)
    console.log(new graph2.GraphToCode().generate(simplified.values(),"fun"));
    console.log(new graph2.GraphToCode().generate(input.values(),"fun"));


    //i need inputset,basisset (nodes only dependent on xyz)
    //basisset= nodes at edge, dpendent on xyz and having children dependent on both
    //graph2.topologicalsort

    let resultCache=new Map([...input.entries()].map(([index,node])=>[node,new graph2.GraphNode(new graph2.VarOperand("mv_"+index))]));
    graph2.visitnodes(output.values(),(node,parentresults)=>{
        if(inputset.has(node)){
            console.log("inp");//wtf is going on
        }
        return new graph2.GraphNode(node.operand,parentresults);
    },resultCache);
    output=output.map(node=>resultCache.get(node));
    input= input.map(node=>resultCache.get(node));

    //console.log(new graph2.GraphToCode().generate(output.values(),"fun"));
    //console.log(new graph2.GraphToCode().generate(input.values(),"fun"));
});