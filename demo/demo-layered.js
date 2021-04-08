cytoscape({
  container: document.getElementById('cy'),
  //elements: fetch('example-graphs/planar-chain.json').then((res) => res.json()),
  elements: fetch('example-graphs/windows_cyto6624.json').then((res) => res.json()),
  // elements: fetch('example-graphs/windows_cyto50.json').then((res) => res.json()),
  autoungrabify: true,
  autounselectify: true,
  layout: {
    name: 'elk',
    elk: {
      algorithm: 'layered',
    },
  },
  style: [
    {
      selector: 'node[isCollapsed > 0]',
      style: {
        // label: 'data(id)',
        // 'font-size': '0.5em',
        'background-color': '#faff79',
        // 'background-opacity': '0.5',
        // 'background-blacken': '0.5',
        'border-width': '1',
        // 'border-style': 'solid',
        // 'border-color': 'black',
      },

    },
    {
      selector: 'node[isCollapsed != 1]',
      style: {
        // label: 'data(name)',
        'font-size': '0.5em',
        'background-color': '#94aaf3',
        // 'background-opacity': '0.5',
        // 'background-blacken': '-0.5',
        'border-width': '1',
        'border-style': 'solid',
        'border-color': 'black'
      },

    },
    {
      selector: 'edge',
      style: {
        'curve-style': 'taxi',
        'taxi-direction': 'rightward',
        'target-arrow-shape': 'triangle',
        'arrow-scale': 0.66,
      },
    },
  ],
});
