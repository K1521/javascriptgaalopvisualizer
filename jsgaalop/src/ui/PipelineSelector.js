/*
<template id="pipeline-selector-template">
  <div class="object-visualization-mode">
    <label class="object-label"></label>
    <select class="pipeline-select">
      <option value="">no_visualization</option>
    </select>
  </div>
</template>
*/

export function addPipelineSelectorForObject(renderableObject) {
  const wrapper =  document.getElementById("pipeline-selector-template").content.cloneNode(true).firstElementChild;

  //wrapper.classList.add('object-visualization-mode');

  // Label
  //const label = document.createElement('label');
  wrapper.querySelector(".object-label").textContent = renderableObject.name;
  //wrapper.appendChild(label);

  const piplinecontrolls=new Map();
  const select =wrapper.querySelector(".pipeline-select") ;//document.createElement('select');
  for (const [methodName,pipeline] of renderableObject.pipelines.entries()) {
    const option = document.createElement('option');
    option.value = methodName;
    option.textContent = methodName;
    select.appendChild(option);

    const pipelinecontrollscontainer=document.createElement('div');
    piplinecontrolls.set(pipeline,pipelinecontrollscontainer);
    pipeline.makeOptions?.(pipelinecontrollscontainer);

  }
  //{
  //const option = document.createElement('option');
  //option.value = "";
  //option.textContent = "no_visualization";
  //select.appendChild(option);
  //}

  // Set initial selection
  select.value ="udfaprox";// renderableObject.activePipelineName ?? [...renderableObject.pipelines.keys()][0];

  // On change: update active pipeline + call ctx

  const controls = wrapper.querySelector(".pipeline-controls");
  const arrow = wrapper.querySelector(".arrow");


  function contentUpdated(){ 
   if (controls.hasChildNodes()){
    arrow.style.visibility="visible";
   }else{
    arrow.style.visibility="hidden";
    controls.style.display="none";
   }
    arrow.style.transform = controls.style.display==="none"?"rotate(0deg)":"rotate(90deg)";
  }
  

  select.onchange = () => {
    renderableObject.setActivePipeline(select.value);
    const piplinecontroll=piplinecontrolls.get(renderableObject.activePipeline);
    
    if(piplinecontroll?.hasChildNodes())controls.replaceChildren(piplinecontroll);
    else{
      controls.replaceChildren();
      controls.style.display="none";
    }
    contentUpdated();
  };
  select.onchange();
  select.addEventListener("click", function (event) {
    event.stopPropagation();
  });



  wrapper.querySelector(".header-row").addEventListener("click", () => {
    controls.style.display = controls.style.display=="block" ? "none" : "block";
    contentUpdated();
  });

  //wrapper.appendChild(select);
  
const object_visualization_controls = document.getElementById('object-visualization-controls');
  object_visualization_controls.appendChild(wrapper);
  // Immediately set the pipeline on first insert if none is active
  /*if (renderableObject.activePipelineName === null) {
    renderableObject.setActivePipeline(select.value);
  }*/
}
