import { getTransition } from './utils.js';

// link circles
class Circles {
  // create circles
  constructor(offset, data, svg) {
    this.focus = null;

    this.circles =
      svg.append('g')
            .attr('id', 'circles')
          .selectAll('circle')
            .data(data)
          .enter()
          .append('circle')
            .attr('r', 2.5);

    this.amountThrough = offset;
  }

  // run every interval
  interval(focused) {
    // update amount through
    this.amountThrough += 0.5;
    this.amountThrough %= 100;

    // update positions
    this.circles
      .attr('transform', ({ source, target }) => {
        const xPos = this.updatePos(source.x, target.x);
        const yPos = this.updatePos(source.y, target.y);

        return `translate(${xPos}, ${yPos})`;
      });

    // style based on focus
    this.circles
      .transition(getTransition(200))
      .style('fill', ({ source, target }) => (
        !focused || source.id === this.focus || target.id === this.focus
          ? '#999999' : '#373739'
      ));
  }

  // update focus
  updateFocus(newFocus) {
    this.focus = newFocus;
  }

  // update position
  updatePos = (source, target) => (
    source + ((target - source) / 100) * this.amountThrough
  );
}

export default Circles;
