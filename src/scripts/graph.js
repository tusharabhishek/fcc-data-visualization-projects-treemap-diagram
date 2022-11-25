import * as d3 from 'd3';

export default function createGraph(data, dim, selector) {
  const graph = d3.select(selector)
    .attr('width', dim.width)
    .attr('height', dim.height);
  
  // size parameters for treemap
  const treemapDim = {
    x: 0,
    y: 0,
    width: 0.8 * dim.width,
    height: dim.height,
    padding: 2
  };
  
  const treemap = createTreeMap(data, treemapDim)

  // collecting leaf nodes, extracting their categories and generating colors
  // for each
  const leaves = treemap.leaves();
  const categories = Array.from(d3.group(leaves, d => d.data.category).keys());
  const colorMap = getColorMap(categories);

  drawTreeMap(leaves, treemapDim, colorMap, graph);

  // size parameters for legend
  const legendDim = {
    x: treemapDim.x + treemapDim.width,
    y: 0,
    width: dim.width - (treemapDim.x + treemapDim.width),
    height: dim.height,
    padding: 25,
    lineHeight: 25,
    boxWidth: 20,
    boxHeight: 20,
    gap: 30
  }
  
  createLegend(categories, legendDim, colorMap, graph);
}

// wraps the data in a d3 hierarchy and lays it out in a treemap of given
// dimensions
function createTreeMap(data, dim) {
  // need to calculate the sum of values and sort the nodes
  const root = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.height - a.height || b.value - a.value);

  const treemapLayout = d3.treemap()
    .size([dim.width, dim.height])
    .paddingInner(dim.padding);

  return treemapLayout(root);
}

// map categories to respective colors and return the map
function getColorMap(categories) {
  const colorMap = new Map();
  
  categories.forEach((v, i, arr) => {
    const interpolateColor = (i % 3 == 0) ? d3.interpolateReds :
      ((i % 3 == 1) ? d3.interpolateBlues : d3.interpolateGreens);
    const color = interpolateColor((1 + 3 * i / arr.length) / 4);
    colorMap.set(v, color);
  });

  return colorMap;
}

// draw the treemap leaves conforming to the given dimensions
function drawTreeMap(leaves, dim, colorMap, graph) {
  const diagram = graph.append('svg')
    .attr('x', dim.x)
    .attr('y', dim.y)
    .attr('width', dim.width)
    .attr('height', dim.height);
  
  // reference to tooltip and its text elements
  const tooltip = d3.select('#tooltip');
  const infoName = d3.select('#info-name');
  const infoCategory = d3.select('#info-category');
  const infoValue = d3.select('#info-value');

  leaves.forEach((leaf, i) => {

    // size parameters of current leaf
    const leafDim = {
      x: leaf.x0,
      y: leaf.y0,
      width: leaf.x1 - leaf.x0,
      height: leaf.y1 - leaf.y0,
      textOffsetX: 5,
      textOffsetY: 15,
      textLineHeight: 15
    };

    const node = diagram.append('rect')
      .classed('tile', true)
      .attr('x', leafDim.x)
      .attr('y', leafDim.y)
      .attr('width', leafDim.width)
      .attr('height', leafDim.height)
      .attr('data-name', leaf.data.name)
      .attr('data-category', leaf.data.category)
      .attr('data-value', leaf.data.value)
      .attr('fill', colorMap.get(leaf.data.category));
    
    const [pOffsetX, pOffsetY] = [10, 10]; // offset from pointer location
    
    node.on('mouseover', (ev) => {

      const [px, py] = d3.pointer(ev, document);

      tooltip.attr('data-value', leaf.data.value)
        .style('visibility', 'visible')
        .style('left', `${px + pOffsetX}px`)
        .style('top', `${py + pOffsetY}px`);
        
      infoName.text(leaf.data.name);
      infoCategory.text(`(${leaf.data.category})`);
      infoValue.text(leaf.data.value);

    }).on('mouseout', (ev) => {

      tooltip.style('visibility', 'hidden');

    });

    // passing listeners on rectangle to the corresponding text 
    const listeners = { over: node.on('mouseover'), out: node.on('mouseout') };
    addFormattedText(leaf.data.name, diagram, leafDim, listeners, i);
  });

  return diagram;
}

// adds text within the rectangular nodes with proper clipping
function addFormattedText(text, diagram, dim, listeners, index) {

  diagram.append('clipPath')
    .attr('id', `text-clip-${index}`)
    .append('rect')
    .attr('x', dim.x)
    .attr('y', dim.y)
    .attr('width', dim.width)
    .attr('height', dim.height);
  
  // split node texts at whitespaces for more visibility
  const brokenNames = text.split(/\s+/);
  brokenNames.forEach((word, i) => {
    
  const textElem = diagram.append('text')
    .classed('node-name', true)
    .attr('clip-path', `url(#text-clip-${index})`)
    .attr('x', dim.x + dim.textOffsetX)
    .attr('y', dim.y + dim.textOffsetY + dim.textLineHeight * i)
    .attr('fill', 'black')
    .on('mouseover', listeners.over)
    .on('mouseout', listeners.out);

    textElem.text(word);
  });
}

// creates legend with given information
function createLegend(categories, dim, colorMap, graph) {
  const legend = graph.append('svg')
    .attr('id', 'legend')
    .attr('x', dim.x)
    .attr('y', dim.y)
    .attr('width', dim.width)
    .attr('height', dim.height);

  categories.forEach((category, i) => {
    
    legend.append('rect')
      .classed('legend-item', true)
      .attr('x', dim.padding)
      .attr('y', dim.padding + dim.lineHeight * i)
      .attr('width', dim.boxWidth)
      .attr('height', dim.boxHeight)
      .attr('fill', colorMap.get(category));
    
    legend.append('text')
      .attr('x', dim.padding + dim.boxWidth + dim.gap)
      .attr('y', dim.padding + dim.lineHeight * i + dim.boxHeight)
      .attr('fill', 'black')
      .text(category);
  });

  return legend;
}