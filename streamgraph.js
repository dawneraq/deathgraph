// <!-- http://bl.ocks.org/WillTurman/4631136 -->

var datearray = [];
var deathCauses = [];
var inputFilename = 'data/death_data_annual.csv';
var layers;

// TODO Set up an eventlistener for drawStreams

function chart(csvpath) {
  var strokecolor = colorrange[0];
  
  var format = d3.time.format('%Y');
  
  var tooltip = d3.select('body')
  .append('div')
  .attr('class', 'remove')
  .style('position', 'absolute')
  .style('z-index', '20')
  .style('visibility', 'hidden')
  .style('top', '30px')
  .style('left', '55px');
  
  var xAxis = d3.svg.axis()
  .scale(x)
  .orient('bottom')
  .ticks(d3.time.years);
  
  var yAxis = d3.svg.axis()
  .scale(y);
  
  var yAxisr = d3.svg.axis()
  .scale(y);

  var stack = d3.layout.stack()
  .offset('zero')
  .values(function(d) { return d.values; })
  .x(function(d) { return d.year; })
  .y(function(d) { return d.mortality_rate; });

  var nest = d3.nest()
  .key(function(d) { return d.cause_of_death; });
  
  var graph = d3.csv(csvpath, function(data) {
    data.forEach(function(d) {
      // Format the data
      d.year = format.parse(d.year);
      d.mortality_rate = +d.mortality_rate;
    });
    
    layers = stack(nest.entries(data));
    
    x.domain(d3.extent(data, function(d) { return d.year; }));
    y.domain([0, d3.max(data, function(d) { return d.y0 + d.y; })]);
    
    drawStreams();
    
    svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)
    // Rotate axis labels
    .selectAll("text")	
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", function(d) {
      return "rotate(-55)";
    });
    
    svg.append('g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(' + width + ', 0)')
    .call(yAxis.orient('right'));
    
    svg.append('g')
    .attr('class', 'y axis')
    .call(yAxis.orient('left'));
    
    svg.selectAll('.layer')
    .attr('opacity', 1)
    .on('mouseover', function(d, i) {
      svg.selectAll('.layer').transition()
      .duration(250)
      .attr('opacity', function(d, j) {
        return j != i ? 0.6 : 1;
      })})
      
      .on('mousemove', function(d, i) {
        mousex = d3.mouse(this);
        mousex = mousex[0];
        var invertedx = x.invert(mousex);
        invertedx = invertedx.getFullYear();
        var selected = (d.values);
        for (var k = 0; k < selected.length; k++) {
          datearray[k] = selected[k].year;
          datearray[k] = datearray[k].getFullYear();
        }
        
        mousedate = datearray.indexOf(invertedx);
        pro = d.values[mousedate].mortality_rate;
        
        d3.select(this)
        .classed('hover', true)
        .attr('stroke', strokecolor)
        .attr('stroke-width', '0.5px'), 
        tooltip.html( '<p>' + d.key + '<br>' + pro + '</p>' ).style('visibility', 'visible');
        
      })
      .on('mouseout', function(d, i) {
        svg.selectAll('.layer')
        .transition()
        .duration(250)
        .attr('opacity', '1');
        d3.select(this)
        .classed('hover', false)
        .attr('stroke-width', '0px'), tooltip.html( '<p>' + d.cause_of_death + '<br>' + pro + '</p>' ).style('visibility', 'hidden');
      });
      
      var vertical = d3.select('#deathgraph')
        .append('div')
        .attr('class', 'remove')
        .style('position', 'absolute')
        .style('z-index', '19')
        .style('width', '1px')
        .style('height', '380px')
        .style('top', '10px')
        .style('bottom', '30px')
        .style('left', '0px')
        .style('background', '#fff');
      
      d3.select('#deathgraph')
      .on('mousemove', function(){  
        mousex = d3.mouse(this);
        mousex = mousex[0] + 5;
        vertical.style('left', mousex + 'px' )})
        .on('mouseover', function(){  
          mousex = d3.mouse(this);
          mousex = mousex[0] + 5;
          vertical.style('left', mousex + 'px')});
        });
}

function drawStreams() {
  let deathCheckboxes = document.getElementsByClassName('death-checkbox');
  let selectedDeathCauses = [];
  
  // Filter layers based on checked boxes
  for (let i = 0; i < deathCheckboxes.length; i++) {
    let someCheckbox = deathCheckboxes[i];

    if (someCheckbox.checked) {
      selectedDeathCauses.push(someCheckbox.value);
    }
  }

  layers.forEach((streamLayer, layerIndex) => {
    let kebabCause = toKebabCase(streamLayer.key);

    if (!selectedDeathCauses.includes(kebabCause)) {
      layers.splice(layerIndex);
    }
  });

  // Draw streams
  svg.selectAll('.layer')
  .data(layers)
  .enter().append('path')
  .attr('class', 'layer')
  .attr('d', function(d) { return area(d.values); })
  .style('fill', function(d, i) { return z(i); });
}

function toKebabCase(someString) {
  return someString.toLowerCase()
  .replace(/,/g, '')
  .replace(/\//g, '-')
  .replace(/ /g, '-');
}

function findAllCauses(csvpath) {
  return new Promise((resolve, reject) => {
    var deathCheckboxContainer = d3.select('#death-checkbox-container');

    d3.csv(csvpath, function(data) {
      data.forEach(function(d) {
        // Create controls
        let causeOfDeath = toKebabCase(d.cause_of_death);
  
        if (!deathCauses.includes(causeOfDeath)) {
  
          let inputGroup = deathCheckboxContainer.append('div')
          .attr('class', 'death-cause-control');
  
          inputGroup.append('input')
          .attr('type', 'checkbox')
          .attr('value', causeOfDeath)
          .attr('id', 'select-' + causeOfDeath)
          .attr('class', 'death-checkbox');
  
          inputGroup.append('label')
          .attr('for', 'select-' +  causeOfDeath)
          .text(d.cause_of_death);
  
          deathCauses.push(causeOfDeath);
        }
      });

      resolve(deathCauses);
    });
  });
}

function selectAllCauses() {
  deathCauses.forEach((cause) => {
    document.getElementById('select-' + cause).checked = true;
  });
}

function clearAllCauses() {
  deathCauses.forEach((cause) => {
    document.getElementById('select-' + cause).checked = false;
  });
}