
//look at tests/sliders/slider6 for usage example
export class ReorderableList {
    static ITEM_CLASS = "ReorderableListItem";
    static DRAGGING_CLASS = "ReorderableListDragging";
    static NODRAG_CLASS = "ReorderableListNoDrag";
    constructor(ListElement) {
        this.ListElement = ListElement;


        ListElement.addEventListener("dragover", (e) => {
            e.preventDefault();

            const movingelement = ListElement.querySelector(`.${ReorderableList.ITEM_CLASS}.${ReorderableList.DRAGGING_CLASS}`);
            if (!movingelement) return;

            for (const prev of ListElement.querySelectorAll(`.${ReorderableList.ITEM_CLASS}:not(.${ReorderableList.DRAGGING_CLASS})`)) {
                const bound = prev.getBoundingClientRect();
                if (e.clientY <= bound.top + bound.height / 2) {
                    ListElement.insertBefore(movingelement, prev);
                    return;
                }
            }
            ListElement.appendChild(movingelement);
        });
    }

    addItem(element) {
        this.ListElement.appendChild(element);
        element.classList.add(ReorderableList.ITEM_CLASS);
        element.draggable = "true";
        element.addEventListener("dragstart", (e) => {
            setTimeout(() => element.classList.add(ReorderableList.DRAGGING_CLASS), 0);
        });
        element.addEventListener("dragend", () => element.classList.remove(ReorderableList.DRAGGING_CLASS));

        // Disable dragging when interacting with slider
        element.addEventListener("pointerdown", (e) => {
            if (e.target.closest(`.${ReorderableList.NODRAG_CLASS}`)) {
                element.draggable = false;
            }
        });

        // Re-enable dragging afterward
        element.addEventListener("pointerup", () => {
            element.draggable = true;
        });
        element.addEventListener("pointerleave", () => {
            element.draggable = true;
        });
    }

    getTemplate(type) {
        return document.querySelector(`template[data-type="${type}"]`);
    }

}


export function makeSlider(template, name, callback = undefined, { min = 0, max = 1, value = 1, step = null, numsteps=200 } = {}) {
    const item = template.content.cloneNode(true).firstElementChild;
    const label = item.querySelector("label");
    const slider = item.querySelector(`input[type="range"]`);
    const valueSpan = item.querySelector("span");

    label.textContent = `${name}:`;
    slider.min = min;
    slider.max = max;
    slider.step = step??(max-min)/(numsteps);
    slider.value = value;

    function updatespanandcallback() {
        const value = Number(slider.value);
        let display=callback?.(value);
        if(display==undefined)display=value.toFixed(2);
        valueSpan.textContent = display;
    };
    updatespanandcallback();
    slider.addEventListener("input", updatespanandcallback);
    return item;
}

export function makeLogSlider(template, name, callback, options = {}) {
  const { min = 1e-10, max = 1, value = 1e-3 } = options;

  const fn = (logx) => {
    const x = Math.pow(10, logx);
    return callback?.(x) ?? x.toExponential(2);
  };

  const newoptions = {
    ...options,
    min: Math.log10(min),
    max: Math.log10(max),
    value: Math.log10(value),
  };

  return makeSlider(template, name, fn, newoptions);
}
/*
const sliderPanel = new ReorderableList(document.getElementById("sliderPanel"));
const sliderinfos = [{ name: "longname", min: 0, max: 1, value: 1 }, { name: "a2", min: 0, max: 1, value: 0.5 }];

for (let i = 3; i < 30; i++)sliderinfos.push({ name: "a" + i, min: 0, max: 1, value: 1 });
//createSliderPanelTemplate(sliderinfos, sliderPanel);

sliderinfos.forEach((x) => {
    const template = sliderPanel.getTemplate("slider");
    sliderPanel.addItem(makeSlider(template, x.name, undefined, x));
});
*/