import * as d3 from 'd3';

import { getTransition } from './utils.js';

// note nodes
class Nodes {
  // create nodes
  constructor(data, links, titles, svg, simulation) {
    this.links      = links;
    this.titles     = titles;
    this.simulation = simulation;

    this.color = d3.scaleLog(d3.schemePaired);
    this.focus = null;

    this.nodes = svg.append('g')
          .attr('id', 'nodes')
      .selectAll('g')
          .data(data)
      .enter()
      .append('g')
          .attr('id', ({ id }) => id)
          .call(d3.drag()
          .on('start', this.dragStarted())
          .on('drag', this.dragged())
          .on('end', this.dragEnded()));

    // node circles
    this.nodes.append('circle')
      .attr('r', ({ id }) => this.getSize(id) * 3 + 15);

    // node text
    this.nodes.append('text')
      .text(({ id }) => titles[id] || id)
      .attr('dy', '0.35em')
      .style('opacity', 0)
      .each(function() {
        const bbox = this.getBBox();
        const padding = 3;

        // rect background
        d3.select(this.parentNode)
          .insert('rect', 'text')
              .attr('x', bbox.x - padding)
              .attr('y', bbox.y - padding)
              .attr('rx', 1)
              .attr('ry', 1)
              .attr('width', bbox.width + (padding * 2))
              .attr('height', bbox.height + (padding * 2))
              .style('opacity', 0);
      });
  }

  // run every tick
  tick() {
    this.nodes
      .attr('transform', ({ x, y }) => `translate(${x}, ${y})`)
      .attr('x', ({ x }) => x)
      .attr('y', ({ y }) => y);
  }

  // run every interval
  interval(focused) {
    this.nodes
      .selectAll('text')
        .transition(getTransition(200))
        .style('opacity', focused ? (({ id }) => this.connected(id, this.focus) ? 1 : 0.35) : 0);

    this.nodes
      .selectAll('rect')
        .transition(getTransition(200))
        .style('opacity', focused ? 1 : 0);

    this.nodes
      .selectAll('circle')
        .transition(getTransition(200))
        .attr('fill', ({ id }) => !focused || this.connected(id, this.focus) ? this.color(this.getSize(id)) : '#373739');
  }

  // update focus
  updateFocus(newFocus) {
    this.focus = newFocus;
  }

  // node size based on connections
  getSize = (id) => (
    (this.links[id]?.length || 0) + Object.values(this.links).flat(1).filter((file) => file === id).length
  );

  // check if nodes connected
  connected = (a, b) => (
    a === b || this.links[a]?.includes(b) || this.links[b]?.includes(a)
  );

  // node drag started
  dragStarted() {
    return (e, d) => {
      if (!e.active) {
        this.simulation.alphaTarget(0.3).restart();
      }

      this.dragged()(e, d);
    };
  }

  // node dragged
  dragged() {
    return (e, d) => {
      if (d.id === this.focus) {
        return;
      }

      d.fx = e.x;
      d.fy = e.y;
    };
  }

  // node drag ended
  dragEnded() {
    return (e, d) => {
      if (!e.active) {
        this.simulation.alphaTarget(0);
      }

      d.fx = null;
      d.fy = null;
    };
  }
}

export default Nodes;
