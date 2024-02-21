import * as d3 from 'd3';

// get transition
const getTransition = (time) => (
  d3.transition()
    .duration(time)
    .ease(d3.easeLinear)
);

export { getTransition };
