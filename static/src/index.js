import _ from 'lodash';

import Graph from './graph.js';

// event source
const eventSource = new EventSource('/data');

// data
let links  = [];
let titles = [];

// create graph
const graph = new Graph();

eventSource.onmessage = (event) => {
  // get data
  const data = JSON.parse(event.data);
  const { links: newLinks, titles: newTitles } = data;

  graph.updateFocus(data.focus);

  // check for updates
  if (!_.isEqual(newLinks, links) || !_.isEqual(newTitles, titles)) {
    // create graph
    graph.update(newLinks, newTitles);

    links = newLinks;
    titles = newTitles;
  }
};
