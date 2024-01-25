import { getTransition } from './utils.js';

// node links
class Links {
  // create links
  constructor(data, svg) {
    this.focus = null;

    this.links = svg.append('g')
          .attr('id', 'links')
      .selectAll('line')
          .data(data)
      .enter()
      .append('line')
          .attr('class', 'link');
  }

  // run every tick
  tick() {
    this.links
      .attr('x1', ({ source }) => source.x)
      .attr('y1', ({ source }) => source.y)
      .attr('x2', ({ target }) => target.x)
      .attr('y2', ({ target }) => target.y);
  }

  // run every interval
  interval(focused) {
    this.links
      .transition(getTransition(200))
      .style('opacity', ({ source, target }) => (
        !focused || source.id === this.focus || target.id === this.focus ? 1 : 0.35
      ));
  }

  // update focus
  updateFocus(newFocus) {
    this.focus = newFocus;
  }
}

export default Links;
