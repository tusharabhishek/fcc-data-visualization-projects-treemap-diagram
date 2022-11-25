import * as d3 from 'd3';

export default function createGraph(data, selector) {
  const root = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.height - a.height || b.value - a.value);

  const graphDim = {
    w: 1280,
    h: 720
  };
  
  const graph = d3.select(selector)
    .attr('width', graphDim.w)
    .attr('height', graphDim.h);
  
  const treemapDim = {
    x: 0,
    y: 0,
    w: 1000,
    h: 720,
    p: 2,
    tOffx: 5,
    tOffy: 15,
    tLinH: 15
  }
  
  const treemapLayout = d3.treemap()
    .size([treemapDim.w, treemapDim.h])
    .paddingInner(treemapDim.p);
  const treemap = treemapLayout(root);

  const leaves = treemap.leaves();
  const colorMap = getColorMap(leaves);

  console.log(leaves);

  const diagram = graph.append('svg')
    .attr('x', treemapDim.x)
    .attr('y', treemapDim.y)
    .attr('width', treemapDim.w)
    .attr('height', treemapDim.h);
  
  const tooltip = d3.select('#tooltip');
  const infoName = d3.select('#info-name');
  const infoCategory = d3.select('#info-category');
  const infoValue = d3.select('#info-value');
  
  leaves.forEach((leaf, i) => {
    console.log(leaf.data.name);

    const [x, y, w, h] = [leaf.x0, leaf.y0, leaf.x1 - leaf.x0, leaf.y1 - leaf.y0];
    const [tx, ty, th] = [treemapDim.tOffx, treemapDim.tOffy, treemapDim.tLinH];
    const [pOffx, pOffy] = [10, 10];

    const node = diagram.append('rect')
      .classed('tile', true)
      .attr('x', x)
      .attr('y', y)
      .attr('width', w)
      .attr('height', h)
      .attr('data-name', leaf.data.name)
      .attr('data-category', leaf.data.category)
      .attr('data-value', leaf.data.value)
      .attr('fill', colorMap.get(leaf.data.category));
    
    node.on('mouseover', (ev) => {
      const [px, py] = d3.pointer(ev, document);
      tooltip.attr('data-value', leaf.data.value)
        .style('display', 'block')
        .style('left', `${px + pOffx}px`)
        .style('top', `${py + pOffy}px`);
      
      infoName.text(leaf.data.name);
      infoCategory.text(`(${leaf.data.category})`);
      infoValue.text(leaf.data.value);
    }).on('mouseout', (ev) => {
      tooltip.style('display', 'none');
    })
    
    const clipDim = { x, y, w, h };
    const textOffset = { x: tx, y: ty, h: th };
    const listeners = { over: node.on('mouseover'), out: node.on('mouseout') };
    addFormattedText(leaf.data.name, diagram, clipDim, textOffset, listeners, i);
  });

  const legendDim = {
    x: treemapDim.x + treemapDim.w,
    y: 0,
    w: graphDim.w - (treemapDim.x + treemapDim.w),
    h: graphDim.h,
    p: 25,
    lh: 25,
    rx: 20,
    ry: 20,
    gap: 30
  }
  
  const legend = graph.append('svg')
    .attr('id', 'legend')
    .attr('x', legendDim.x)
    .attr('y', legendDim.y)
    .attr('width', legendDim.w)
    .attr('height', legendDim.h);
  
  const categories = Array.from(d3.group(leaves, d => d.data.category).keys());
  categories.forEach((category, i) => {
    console.log(category);
    
    legend.append('rect')
      .classed('legend-item', true)
      .attr('x', legendDim.p)
      .attr('y', legendDim.p + legendDim.lh * i)
      .attr('width', legendDim.rx)
      .attr('height', legendDim.ry)
      .attr('fill', colorMap.get(category));
    
    legend.append('text')
      .attr('x', legendDim.p + legendDim.p)
      .attr('y', legendDim.p + legendDim.lh * i + legendDim.ry)
      .attr('fill', 'black')
      .text(category);
  });
}

function getColorMap(leaves) {
  const categories = Array.from(d3.group(leaves, d => d.data.category).keys());
  const colorMap = new Map();
  
  categories.forEach((v, i, arr) => {
    const interpolateColor = (i % 3 == 0) ? d3.interpolateReds :
      ((i % 3 == 1) ? d3.interpolateBlues : d3.interpolateGreens);
    const color = interpolateColor((1 + 3 * i / arr.length) / 4);
    colorMap.set(v, color);
  });

  return colorMap;
}

function addFormattedText(text, diagram, rectDim, offset, listeners, index) {

  diagram.append('clipPath')
    .attr('id', `text-clip-${index}`)
    .append('rect')
    .attr('x', rectDim.x)
    .attr('y', rectDim.y)
    .attr('width', rectDim.w)
    .attr('height', rectDim.h);
  
  const brokenNames = text.split(/\s+/);
  brokenNames.forEach((word, i) => {
    
    const textElem = diagram.append('text')
    .classed('node-name', true)
    .attr('clip-path', `url(#text-clip-${index})`)
    .attr('x', rectDim.x + offset.x)
    .attr('y', rectDim.y + offset.y + offset.h * i)
    .attr('fill', 'black')
    .on('mouseover', listeners.over)
    .on('mouseout', listeners.out);

    textElem.text(word);
  });
}