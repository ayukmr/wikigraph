import * as d3 from 'd3';
import { getTransition } from './utils.js';

import Nodes   from './nodes.js';
import Links   from './links.js';
import Circles from './circles.js';

// d3 graph
class Graph {
  // create graph
  constructor() {
    this.svg = null;

    this.nodes   = null;
    this.lines   = null;
    this.circles = null;

    this.focus    = null;
    this.interval = null;
  }

  // update graph data
  update(links, titles) {
    this.links  = links;
    this.titles = titles;

    if (this.interval) {
      // stop interval
      this.interval.stop();
      this.interval = null;
    }

    this.create();
  }

  // update focus
  updateFocus(newFocus) {
    this.focus = newFocus;

    // update element focus
    if (this.svg) {
      this.nodes.updateFocus(newFocus);
      this.lines.updateFocus(newFocus);
      this.circles.map((c) => c.updateFocus(newFocus));
    }
  }

  // create d3 graph
  create() {
    const nodesData =
      Array.from(
        new Set(Object.keys(this.links))
      ).map((file) => ({ id: file }));

    const linksData =
      Object.entries(this.links)
        .flatMap(([k, v]) => (
          v.map((v) => ({ source: k, target: v }))
        ));

    const width  = window.innerWidth;
    const height = window.innerHeight;

    // reset html
    d3.select('body').html(null);

    // create svg
    this.svg = d3.select('body')
      .append('svg')
        .attr('width',  width)
        .attr('height', height)
        .attr('viewBox', [-width / 2 * 1.5, -height / 2 * 1.5, width * 1.5, height * 1.5]);

    // create simulation
    const simulation = d3.forceSimulation(nodesData)
      .force('link',   d3.forceLink(linksData).id(({ id }) => id).distance(100))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('x', d3.forceX())
      .force('y', d3.forceY());

    // create elements
    this.lines   = new Links(linksData, this.svg);
    this.circles = [0, 50].map((offset) => new Circles(offset, linksData, this.svg));
    this.nodes   = new Nodes(nodesData, this.links, this.titles, this.svg, simulation);

    // update lines and nodes
    simulation.on('tick', () => {
      this.nodes.tick();
      this.lines.tick();
    });

    // run every interval
    this.interval = d3.interval(() => {
      const focused = this.focus && this.links[this.focus];

      const elem = d3.select(`#${this.focus}`);
      const size = 500;

      const width  = window.innerWidth;
      const height = window.innerHeight;

      // adjust svg sizing
      this.svg
        .attr('width', width)
        .attr('height', height)
        .transition(getTransition(500))
        .attr(
          'viewBox',
          focused
            ? [elem.attr('x') - (size / 2), elem.attr('y') - (size / 2), size, size]
            : [-width / 2 * 1.5, -height / 2 * 1.5, width * 1.5, height * 1.5]
        );

      // update elements
      this.nodes.interval(focused);
      this.lines.interval(focused);
      this.circles.map((c) => c.interval(focused));
    });
  }
}

export default Graph;
