import createGraph from './graph';

const dataSrc = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json';

document.addEventListener('DOMContentLoaded', () => {
  fetch(dataSrc)
    .then(res => res.json())
    .then(json => createGraph(json, '#graph'));
});