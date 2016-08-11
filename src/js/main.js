import { select, selectAll } from 'd3-selection'
import { csvParse } from 'd3-dsv'
import { scaleLinear } from 'd3-scale'
import { axisLeft } from 'd3-axis'
import { format } from 'd3-format'
import data from '../assets/data/countries.csv!text'

const height = 1200;
const width = 800;

const topPadding = 50;

const circleSize = 10;
const circleGap = 1;

const yearHeight = 20;

const xDefaults = {
  "primary": 100,
  "lowerSecondary": 300,
  "upperSecondary": 500
}

export function init(el, context, config, mediator) {
  let parsedData = csvParse(data);
  render(el, parsedData)
}

var scaleY = scaleLinear()
  .domain([1970,2100])
  .range([topPadding,height]);

var axis = axisLeft(scaleY).tickFormat(format("d")).ticks(20);

function render(el, dCountries) {
  let svg = select(el).html("")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("overflow", "visible")
    .style("margin-bottom", "100px");

  svg.append("g")
    .attr("transform", "translate(60,0)")
    .call(axis);

  svg.selectAll(".tick line")
    .attr("x1", width)
    .attr("stroke", "#bdbdbd");

  svg.select(".domain")
    .remove();

  svg.selectAll("circle.primary")
    .data(dCountries)
    .enter()
      .append("circle")
      .attr("class", d => "flag flag-" + d.code)
      .classed("primary", true)
      .attr("cx", d => circleCoord(d, dCountries, "primary").x)
      .attr("cy", d => circleCoord(d, dCountries, "primary").y)
      .attr("r", circleSize/2)
      .attr("data-country", d => d.country)
      .style("fill", "#cc2b12")
      .style("fill-opacity", "0.3")
      .style("stroke", "#cc2b12")
      .style("stroke-width", "1px");

  svg.selectAll("circle.lowersec")
    .data(dCountries)
    .enter()
      .append("circle")
      .attr("class", d => "flag flag-" + d.code)
      .classed("lowersec", true)
      .attr("cx", d => circleCoord(d, dCountries, "lowerSecondary").x)
      .attr("cy", d => circleCoord(d, dCountries, "lowerSecondary").y)
      .attr("r", circleSize/2)
      .attr("data-country", d => d.country)
      .style("fill", "#cc2b12")
      .style("fill-opacity", "0.3")
      .style("stroke", "#cc2b12")
      .style("stroke-width", "1px");

  svg.selectAll("circle.uppersec")
    .data(dCountries)
    .enter()
      .append("circle")
      .attr("class", d => "flag flag-" + d.code)
      .classed("uppersec", true)
      .attr("cx", d => circleCoord(d, dCountries, "upperSecondary").x)
      .attr("cy", d => circleCoord(d, dCountries, "upperSecondary").y)
      .attr("r", circleSize/2)
      .attr("data-country", d => d.country)
      .style("fill", "#cc2b12")
      .style("fill-opacity", "0.3")
      .style("stroke", "#cc2b12")
      .style("stroke-width", "1px");

  svg.selectAll("circle")
    .on("mouseover", function(d) {
      let el = select(this);
      let country = el.attr("data-country");

      let circles = selectAll('circle[data-country="' + country + '"]')
        .style("stroke", "#333")
        .style("fill", "#333")
        .classed("hover", true);

      let primary = select('circle.primary[data-country="' + country + '"]');
      let lowerSec = select('circle.lowersec[data-country="' + country + '"]');
      let upperSec = select('circle.uppersec[data-country="' + country + '"]');

      svg.append("line")
        .style("stroke", "#767676")
        .classed("hover", true)
        .style("stroke-width", "1px")
        .attr("x1", primary.attr("cx"))
        .attr("x2", lowerSec.attr("cx"))
        .attr("y1", primary.attr("cy"))
        .attr("y2", lowerSec.attr("cy"));

      svg.append("text")
        .classed("hover", true)
        .text(primary.attr("data-country"))
        .attr("x", Number(primary.attr("cx")) + circleSize/2 + 2)
        .attr("y", Number(primary.attr("cy")) + circleSize/2 - 1); 

      svg.append("line")
        .style("stroke", "#767676")
        .classed("hover", true)
        .style("stroke-width", "1px")
        .attr("x1", upperSec.attr("cx"))
        .attr("x2", lowerSec.attr("cx"))
        .attr("y1", upperSec.attr("cy"))
        .attr("y2", lowerSec.attr("cy"));

    })
    .on("mouseout", function(d) {
      selectAll('circle.hover')
        .style("fill", "#cc2b12")
        .style("stroke", "#cc2b12")
        .classed("hover", false);

      selectAll('line.hover')
        .remove();

      selectAll('text.hover')
        .remove();
    });
}

function isOdd(num) { return (num % 2) == 1;}

function circleCoord(countryData, data, column) {
  function isEnough(arr, index) {
    let total = arr.reduce((previousValue, currentValue) => {
      return previousValue + currentValue;
    });

    return total > index;
  }

  function whichRow(index, layout) {
    var rowCount;

    for(var i = 1; i < layout.length + 1; i++) {
      if(!rowCount && isEnough(layout.slice(0, i), index)) {
          rowCount = i;
      }
    }

    return rowCount;
  }

  function whichColumn(indexOfCountry, layout) {
    let totalBeforeRow = layout.slice(0, whichRow(indexOfCountry, layout)).reduce((previousValue, currentValue) => {
      return previousValue + currentValue;
    }) - layout[whichRow(indexOfCountry, layout) - 1];

    let indexInRow = indexOfCountry - totalBeforeRow;

    return indexInRow;
  }

  let circlesAtSameYear = data.filter(country => {
    return country[column] === countryData[column];
  });

  let numberOfCirclesAtSameYear = circlesAtSameYear.length;
  let indexOfCountry = circlesAtSameYear.indexOf(countryData);
  let layout = (layouts[numberOfCirclesAtSameYear]) ? layouts[numberOfCirclesAtSameYear] : [Math.ceil(numberOfCirclesAtSameYear/4),Math.ceil(numberOfCirclesAtSameYear/4),Math.ceil(numberOfCirclesAtSameYear/4),Math.ceil(numberOfCirclesAtSameYear/4)];

  let xDefault = xDefaults[column];
  let yDefault = scaleY(countryData[column]) - ((layout.length+1)*circleSize)/2;

  let oddOffset = (!isOdd(whichRow(indexOfCountry, layout))) ? 0 : (circleSize+circleGap) / 2;

  let x = xDefault + whichColumn(indexOfCountry, layout)*(circleSize+circleGap) + oddOffset;
  let y = yDefault + whichRow(indexOfCountry, layout)*(circleSize);
  
  return {
    "x": x,
    "y": y
  }
}

const layouts = {
  1: [1],
  2: [2],
  3: [1, 2],
  4: [2, 2],
  5: [2, 3],
  6: [2, 2, 2],
  7: [2, 3, 2],
  8: [3, 3, 2],
  9: [3, 3, 3],
  10: [4, 3, 3],
  11: [4, 4, 3],
  19: [6, 7, 6]
}
