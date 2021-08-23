import Tippy from 'tippy.js';
// import assign from './assign';
import { generateGetBoundingClientRect } from './assign';

// tooltip helper:
let tip, selectedNodeFromTip, cytoLayout, isLoading = true, firstTimeRendering = true;

/**
 * When playing around with the layout, the tooltips were not being destroyed automatically. Therefore, we must remove them manually.
 */
const removeResidualTipsIfAny = () => {
  const tippys = document.getElementsByClassName('tippy-box');
  for (const tippy of tippys) {
    const parent = tippy.parentNode;
    if (parent.style.visibility === 'hidden') {
      parent.parentNode.removeChild(parent);
    }
  }
};

const removeTip = () => {
  if (tip) {
    // remove the older tooltip, so we can render the new one.
    tip.destroy();
  }
  tip = undefined;
  removeResidualTipsIfAny();
};

const setAndRefreshLayout = (cy) => {
  removeTip();
  selectedNodeFromTip = undefined;
  cy.nodes().removeListener('mouseover tap');
  cy.removeListener('zoom');
  if (cytoLayout) {
    cytoLayout.stop();
  } else {
    // cytoLayout = cy.makeLayout(assign({}, cy.options().layout, { fit: false }));
    cytoLayout = cy.makeLayout(cy.options().layout);
  }
  cytoLayout.run();
};

const createHtmlForTip = ({ _private: { data } }) => {
  const { rulePattern } = data;
  let rulePatterHtml = '';
  if (rulePattern) {

    const rulePatterSplit = rulePattern.split('\n');
    for (const pattern of rulePatterSplit) {
      rulePatterHtml += `<div class='menu-sub-content'><span class='pattern-value'>${pattern}</span></div>`;
    }
  }
  let baseHtml = `<div class="node-text wordwrap">
  <div class="menu-content"><b>Node ID:</b><span>${data.id}</span>
  <div class="menu-content"><b>Pattern:</b><span>${data.pattern}</span>
  </div>`;
  if (rulePatterHtml) {
    baseHtml += `<div class='menu-sub-content'><b>Rule Pattern</b></div>${rulePatterHtml}`;
  }
  return baseHtml;
};

const isEmpty = (param) => {
  return !param || param.length === 0;
};

const isLeafNode = (node) => {
  return node.successors().length === 0;
  // return node.isChildless();
};

const tapListenerForUnCollapsing = (evt) => {
  evt.stopPropagation();
  evt.preventDefault();
  if (isLoading) {
    return;
  }
  const { target: nodeClicked } = evt;
  const collapseSuccessors = nodeClicked.data('collapseSuccessors');
  if (!isEmpty(collapseSuccessors)) {
    // you have to un-collapse the node.
    const { cy } = evt;
    freezeUI(true, cy);
    nodeClicked.data('collapseSuccessors', []);
    nodeClicked.data('isCollapsed', 0);
    collapseSuccessors.style('display', 'element');
    collapseSuccessors.nodes().data('isCollapsed', 0);
    collapseSuccessors.nodes().data('collapseSuccessors', []);
    setAndRefreshLayout(cy);
  }
};

const tapListenerForCollapsing = (evt) => {
  evt.stopPropagation();
  evt.preventDefault();
  if (isLoading) {
    return;
  }
  const { target: nodeClicked } = evt;
  if (isLeafNode(nodeClicked)) {
    // no need of collapsing it as we can't collapse leaf nodes.
    return;
  }
  const collapseSuccessors = nodeClicked.data('collapseSuccessors');
  if (isEmpty(collapseSuccessors)) {
    // we're collapsing the nodes.
    const { cy } = evt;
    freezeUI(true, cy);
    nodeClicked.successors().style('display', 'none');
    nodeClicked.data('isCollapsed', 1);
    nodeClicked.data('collapseSuccessors', nodeClicked.successors());
    setAndRefreshLayout(cy);
  }
};

const freezeUI = (freeze, cy) => {
  isLoading = freeze;
  const loadingMsgContainer = document.getElementById('loading-msg');
  if (isLoading) {
    loadingMsgContainer.classList.remove('hidden'); // show the msg container.
    cy.container().classList.add('while-loading'); // gray out the tree
  } else {
    loadingMsgContainer.classList.add('hidden'); // hide the msg container
    cy.container().classList.remove('while-loading'); // restore the color of the tree.
  }
};

const markTheDeepestPath = (cy, maxId) => {
  const theMax = cy.$(`#${maxId}`)
  theMax.data('isTheDeepest', 1);
  theMax.toggleClass('success');
  const predecessors =  theMax.predecessors('node');
  predecessors.data('isTheDeepest', 1);
  predecessors.toggleClass('success');
};

const defaults = {
  nodeDimensionsIncludeLabels: false, // Boolean which changes whether label dimensions are included when calculating node dimensions
  fit: true, // Whether to fit
  padding: 20, // Padding on fit
  animate: false, // Whether to transition the node positions
  animateFilter: function () {
    return false;
  }, // Whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
  animationDuration: 500, // Duration of animation in ms if enabled
  animationEasing: undefined, // Easing of animation if enabled
  transform: function (node, pos) {
    return pos;
  }, // A function that applies a transform to the final node position
  ready: ({ cy }) => {
    cy.on('mouseover', 'node', (evt) => {
      if (isLoading) {
        return;
      }
      removeTip();
      const node = evt.target;
      const dummyDomEle = document.createElement('div');
      tip = new Tippy(dummyDomEle, { // tippy props:
        // getReferenceClientRect: generateGetBoundingClientRect(evt.renderedPosition.x, evt.renderedPosition.y), // https://atomiks.github.io/tippyjs/v6/all-props/#getreferenceclientrect
        getReferenceClientRect: generateGetBoundingClientRect(evt.originalEvent.x, evt.originalEvent.y - 20), // https://atomiks.github.io/tippyjs/v6/all-props/#getreferenceclientrect
        trigger: 'manual', // mandatory, we cause the tippy to show programmatically.
        // your own custom props
        // content prop can be used when the target is a single element https://atomiks.github.io/tippyjs/v6/constructor/#prop
        content: () => {
          const baseHtml = createHtmlForTip(node);
          const content = document.createElement('div');
          content.classList.add('clickable'); // add a style, so the user can see it's clickable.
          content.innerHTML = baseHtml;
          return content;
        },
        hideOnClick: true,
        allowHTML: false,
        onShow: (instanceTip) => {
         setTimeout(() => { // wait a little bit (to actually get rendered)
           instanceTip.popper.addEventListener('click', () => {
             selectedNodeFromTip = node.data();
             console.log('selectedNodeFromTip ->', selectedNodeFromTip);
           });
         });
        },
      });
      tip.show();
    });

    // TODO: We need to find the id of the node that has the deepest path.
    markTheDeepestPath(cy, 1484);
    // As we can call the layout from here, we have to restore the proper tap listener.
    cy.nodes().forEach((node) =>{
      if (firstTimeRendering && node.data('isTheDeepest') !== 1 && (node.hasClass('failure') || node.hasClass('unknown'))) {
        // we want to collapse all the nodes that has the failure or unknown class.
        // This is required only when rendering for the first time the tree.
        node.successors().style('display', 'none');
        // if we want, we can comment the following line and not blacken the background of the node. It will be changed to isCollapsed=1,
        // when the user actually clicks on the node in the UI.
        node.data('isCollapsed', 1);
        node.data('collapseSuccessors', node.successors());
      }
      if (!isEmpty(node.data('collapseSuccessors'))) {
        node.on('tap', tapListenerForUnCollapsing);
      } else {
        node.on('tap', tapListenerForCollapsing);
      }
    });

    cy.on('zoom', () => {
      removeTip();
    });
    freezeUI(false, cy);
    firstTimeRendering = false;
  }, // Callback on layoutready
  stop: undefined, // Callback on layoutstop
  elk: {
    // Options to pass directly to ELK `layoutOptions`
    // the elk algorithm to use
    // one of 'box', 'disco', 'force', 'layered', 'mrtree', 'radial', 'random', 'stress'
    // (see https://www.eclipse.org/elk/reference/algorithms.html)
    algorithm: undefined,
  },
  priority: function () {
    return null;
  }, // Edges with a non-nil value are skipped when geedy edge cycle breaking is enabled
};

export default defaults;
