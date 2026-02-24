const selectortemplate=`<template id="pipeline-selector-template">
  <div class="object-visualization-mode">
    <label class="object-label"></label>
    <select class="pipeline-select">
      <option value="">no_visualization</option>
    </select>
  </div>
</template>`


export function addPipelineSelectorForObject(renderableObject, container) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('object-visualization-mode');

  // Label
  const label = document.createElement('label');
  label.textContent = renderableObject.name;
  wrapper.appendChild(label);

  // Selector
  const select = document.createElement('select');
  for (const methodName of renderableObject.pipelines.keys()) {
    const option = document.createElement('option');
    option.value = methodName;
    option.textContent = methodName;
    select.appendChild(option);
  }
  {
  const option = document.createElement('option');
  option.value = "";
  option.textContent = "no_visualization";
  select.appendChild(option);
  }

  // Set initial selection
  select.value ="";// renderableObject.activePipelineName ?? [...renderableObject.pipelines.keys()][0];

  // On change: update active pipeline + call ctx
  select.onchange = () => {
    renderableObject.setActivePipeline(select.value);
  };

  wrapper.appendChild(select);
  container.appendChild(wrapper);

  // Immediately set the pipeline on first insert if none is active
  if (renderableObject.activePipelineName === null) {
    renderableObject.setActivePipeline(select.value);
  }
}
