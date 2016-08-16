import { select, selectAll, mouse } from 'd3-selection'
import { csvParse } from 'd3-dsv'
import { scaleLinear, scaleSqrt } from 'd3-scale'
import { axisTop, axisLeft } from 'd3-axis'
import { format } from 'd3-format'
import { transition } from 'd3-transition'
import { easeCubic, easeElasticOut, easeExpIn, easeBackOut, easeBounceOut, easePolyIn } from 'd3-ease' 
import { packSiblings, packEnclose } from 'd3-hierarchy'

export function incomeColour(incomeGroup) {
  var colour;
  switch(incomeGroup) {
    case "High income":
        colour = "#005689";
        break;
    case "Upper middle income":
        colour = "#4bc6df";
        break;
    case "Lower middle income":
        colour = "#ffbb00";
        break;
    case "Low income":
        colour = "#c05303";
        break;
    default:
        colour = "#767676";
  }
  return colour;
}


// export function incomeColour(incomeGroup) {
//   var colour;
//   switch(incomeGroup) {
//     case "High income":
//         colour = "rgb(57, 164, 216)";
//         break;
//     case "Upper middle income":
//         colour = "rgb(138, 199, 205)";
//         break;
//     case "Lower middle income":
//         colour = "rgb(253, 208, 158)";
//         break;
//     case "Low income":
//         colour = "rgb(237, 61, 97)";
//         break;
//     default:
//         colour = "#767676";
//   }
//   return colour;
// }

export function drawCircle(svg, data, title, el) {
  const padding = 2;

  let circles = packSiblings(data);
  let bigCircle = packEnclose(circles);
  let totalEl = el.select(".count");
  let tooltip = select(".tooltip");

  let incomeElObj = {
    "Low income": el.select(".low"),
    "Lower middle income": el.select(".lm"),
    "Upper middle income": el.select(".um"),
    "High income": el.select(".high")
  };

  svg.append("g").append("circle")
    .attr("cx", bigCircle.x )
    .attr("cy", bigCircle.y )
    .attr("r", bigCircle.r )
    .style("fill", "#f6f6f6")
    .style("fill-opacity", "0.75");

  svg.append("g").selectAll("circle")
    .data(circles)
    .enter().append("circle")
      .attr("class", (d,i) => { return "country " + d.code3; })
      .classed("small-circle", true)
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .style("fill", (d) => {
        return incomeColour(d.income);
      })
      .style("stroke", (d) => {
        return incomeColour(d.income);
      })
      .style("fill-opacity", "0.2")
      .style("stroke-width", "1px")
      .attr("r", 0)
      .on("mousemove", function(d) {
        let year = (d.educationLevel === "universal secondary education") ? d.upperSecondary : d.primary;
        let achieveMessage = (Number(year) > 2015) ? "Forecast to achieve" : "Achieved";
        let verticalOffset = (Number(year) > 2015) ? event.pageY - 84 : event.pageY - 72;

        tooltip.style("position", "absolute")
          .style("display", "block")
          .style("left", (event.pageX - 116) + "px")
          .style("top", verticalOffset + "px")
          .html(`<span class="tooltip__country">${d.country}</div><span class="tooltip__when">${achieveMessage} ${d.educationLevel} in <b>${year}</b>, before <b>${d.before}%</b> of the world</span>`);
      })
      .on("mouseout", function(d) {
        tooltip.style("display", "none");
      })
      .transition()
        .ease(easeElasticOut)
        .delay(function(d, i) { return 500 + (i * 25); })
        .duration(1200)
        .attr("r", (d, i) => {
          setTimeout(() => {
            let newCountTotal = Number(totalEl.html()) + 1;
            if(d.income !== "Not classified") {
              let newIncomeTotal = Number(incomeElObj[d.income].html()) + 1;
              incomeElObj[d.income].html(newIncomeTotal);
            }
            totalEl.html(newCountTotal);
          }, 500+(i * 25));

          return d.r - padding
        });

  svg.append("g").selectAll("text")
    .data(circles)
    .enter().append("text")
      .classed("circle-label", true)
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("dy", "4")
      .style("text-anchor", "middle")
      .style("fill", (d) => {
        return incomeColour(d.income);
      })
      .style("opacity", 0)
      .text((d) => {
        return d.code3;
      })
      .transition()
        .delay(function(d, i) { return (i * 25) + 500 + 500; })
        .duration(300)
        .style("opacity", (d) => {
          if(d.r > 12) {
            return 1;
          } else {
            return 0;
          }
        });

  svg.append("text")
    .text(title)
    .attr("y", (svg.attr("height")/2) - bigCircle.r - 12)
    .attr("x", svg.attr("width")/2)
    .style("text-anchor", "middle");

  //position groups
  svg.selectAll("g")
    .style("transform", "translate(" + svg.attr("width")/2 + "px," + svg.attr("height")/2 + "px)");
}


export function drawBlockThree(svg, data) {
  const margins = {
    left: 60,
    right: 0
  }

  const circleSize = 1;

  const lineSpacing = ((svg.attr("width") - margins.left)/data.length); 

  let sortedData = data.sort((a,b) => {
    return Number(a.primary) - Number(b.primary);
  });

  let tooltip = select(".tooltip");

  let scaleY = scaleLinear()
    .domain([1970, 2100])
    .range([0, svg.attr("height")]);

  let axis = axisLeft(scaleY).tickFormat(format("d"));

  svg.append("g")
    .call(axis);

  svg.selectAll(".tick line").attr("x2", svg.attr("width")).attr("x1", 0)
    .style("stroke", "#e9e9e9")
    .style("stroke-dasharray", ("1,1"));

  svg.selectAll(".tick text").attr("x", 0)
    .attr("dy", -4)
    .style("text-anchor", "initial");

  svg.selectAll(".domain").remove();

  svg.append("g")
    .selectAll("line")
    .data(sortedData)
    .enter()
    .append("line")
      .attr("y1", (d) => {
        return scaleY("2015");
      })
      .attr("x1", (d,i) => {
        return margins.left + i*lineSpacing;
      })
      .attr("y2", (d) => {
        if(Number(scaleY(d.primary)) > Number(scaleY("2015"))) {
          return Number(scaleY(d.primary)) - circleSize;
        } else if(Number(scaleY(d.primary)) === Number(scaleY("2015"))) {
          return scaleY("2015");
        } else {
          return Number(scaleY(d.primary)) + circleSize;
        }
      })
      .attr("x2", (d,i) => {
        return margins.left + i*lineSpacing;
      })
      .style("stroke", (d) => {
        return "#f6f6f6";
      })
      .style("stroke-width", "6px")
      .on("mouseover", function(d, i) {
        let rect = svg.node().getBoundingClientRect();
        let yDist = Number(scaleY(d.primary)) + Number(rect.top) + Number(window.scrollY) - 70;
        let xDist = Number(rect.left) + Number(margins.left + i*lineSpacing);

        tooltip.style("position", "absolute")
          .style("display", "block")
          .style("left", (xDist - 116) + "px")
          .style("top", yDist + "px")
          .html(`<span class="tooltip__country">${d.country}</div><span class="tooltip__when">Achieved in <b></b>, before <b>${d.before}%</b> of the world</span>`);
      });

    svg.on("mouseleave", function(d, i) {
      tooltip.style("display", "none");
    });

    var targetLineGroup = svg.append("g");
    
    targetLineGroup.append("line")
      .attr("y1", scaleY("2015"))
      .attr("x1", 0)
      .attr("y2", scaleY("2015"))
      .attr("x2", svg.attr("width"))
      .style("stroke", "#bdbdbd")
      .style("stroke-width", "1px")
      .style("pointer-events", "none");
    
    targetLineGroup.append("text")
      .text("Target year for universal primary education")
      .attr("y", scaleY("2015"))
      .attr("x", svg.attr("width"))
      .attr("dy", -5)
      .style("text-anchor", "end")
      .style("fill", "#bdbdbd")
      .classed("target-line-label", true);

    svg.append("g")
      .selectAll("line")
      .data(sortedData)
      .enter()
      .append("line")
        .attr("x1", (d,i) => {
          return margins.left + i*lineSpacing - 3;
        })
        .attr("x2", (d,i) => {
          return margins.left + i*lineSpacing + 3;
        })
        .attr("y1", (d,i) => {
          return scaleY(d.primary);
        })
        .attr("y2", (d,i) => {
          return scaleY(d.primary);
        })
        .style("stroke", (d) => {
          return incomeColour(d.income);
        })
        .style("stroke-width", "2px");

    svg.append("g")
      .selectAll("text.label")
      .data(sortedData)
      .enter()
      .append("text")
        .attr("y", (d) => {
          return scaleY(d.primary);
        })
        .attr("x", (d,i) => {
          return margins.left + i*lineSpacing;
        })
        .attr("dx", (d) => {
          if(Number(scaleY(d.primary)) <= Number(scaleY("2015"))) {
            return Number(scaleY(d.primary)) - Number(scaleY("2015")) - 5;
          } else {
            return Number(scaleY(d.primary)) - Number(scaleY("2015")) + 5;
          }
        })
        .text(d => d.country)
        .style("fill", "#bdbdbd")
        .style("dominant-baseline", "central")
        .style("text-anchor", (d) => {
          if(Number(scaleY(d.primary)) <= Number(scaleY("2015"))) {
            return "end";
          } else {
            return "start";
          }
        })
        .attr("transform", (d,i) => {
          return "rotate(-90," + (margins.left + i*lineSpacing) + "," + scaleY(d.primary) + ")";
        })
        .attr("data-code", d => d.code3)
        .classed("country-label", true)
        .style("display", "none");

    svg.append("text")
      .text("Years behind target")
      .attr("x", svg.attr("width") - 40)
      .attr("y", scaleY("2050"))
      .style("text-anchor", "end")
      .style("fill", "#767676")
      .style("stroke", "#fff")
      .style("stroke-width", "3px")
      .classed("target-label", true);

    svg.append("text")
      .text("Years behind target")
      .attr("x", svg.attr("width") - 40)
      .attr("y", scaleY("2050"))
      .style("text-anchor", "end")
      .style("fill", "#767676")
      .classed("target-label", true);

    svg.append("text")
      .text("Years infront of target")
      .attr("x", 80)
      .attr("y", scaleY("1995"))
      .style("fill", "#767676")
      .style("stroke", "#fff")
      .style("stroke-width", "3px")
      .classed("target-label", true);

    svg.append("text")
      .text("Years infront of target")
      .attr("x", 80)
      .attr("y", scaleY("1995"))
      .style("fill", "#767676")
      .classed("target-label", true);

    svg.append("g")
    .selectAll("line")
    .data(sortedData)
    .enter()
    .append("line")
      .attr("y1", (d) => {
        return svg.attr("height");
      })
      .attr("x1", (d,i) => {
        return margins.left + i*lineSpacing;
      })
      .attr("y2", 0)
      .attr("x2", (d,i) => {
        return margins.left + i*lineSpacing;
      })
      .style("stroke", "#fff")
      .style("stroke-opacity", 0)
      .style("stroke-width", "8px")
      .on("mouseenter", function(d, i) {
        let rect = svg.node().getBoundingClientRect();
        let yDist = Number(scaleY(d.primary)) + Number(rect.top) + Number(window.scrollY) - 70;
        let xDist = Number(rect.left) + Number(margins.left + i*lineSpacing);

        tooltip.style("position", "absolute")
          .style("display", "block")
          .style("left", (xDist - 116) + "px")
          .style("top", yDist + "px")
          .html(`<span class="tooltip__country">${d.country}</div><span class="tooltip__when">Achieved in <b></b>, before <b>${d.before}%</b> of the world</span>`);
      });

    svg.on("mouseleave", function(d, i) {
      tooltip.style("display", "none");
    });

  }

  export function drawBlockThreeSvg2(svg, data) {
  const margins = {
    left: 60,
    right: 0
  }

  const circleSize = 1;

  const lineSpacing = ((svg.attr("width") - margins.left)/data.length); 

  let tooltip = select(".tooltip");

  let sortedData = data.sort((a,b) => {
    return Number(a.upperSecondary) - Number(b.upperSecondary);
  });

  let scaleY = scaleLinear()
    .domain([1970, 2100])
    .range([0, svg.attr("height")]);

  let axis = axisLeft(scaleY).tickFormat(format("d"));

  svg.append("g")
    .call(axis);

  svg.selectAll(".tick line").attr("x2", svg.attr("width"))
    .attr("x1", 0)
    .style("stroke", "#e9e9e9")
    .style("stroke-dasharray", ("1, 1"));

  svg.selectAll(".tick text").attr("x", 0)
    .attr("dy", -4)
    .style("text-anchor", "initial");

  svg.selectAll(".domain").remove();

  svg.append("g")
    .selectAll("line")
    .data(sortedData)
    .enter()
    .append("line")
      .attr("y1", (d) => {
        return scaleY("2030");
      })
      .attr("x1", (d,i) => {
        return margins.left + i*lineSpacing;
      })
      .attr("y2", (d) => {
        if(Number(scaleY(d.upperSecondary)) > Number(scaleY("2030"))) {
          return Number(scaleY(d.upperSecondary)) - circleSize;
        } else if(Number(scaleY(d.upperSecondary)) === Number(scaleY("2030"))) {
          return scaleY("2030");
        } else {
          return Number(scaleY(d.upperSecondary)) + circleSize;
        }
      })
      .attr("x2", (d,i) => {
        return margins.left + i*lineSpacing;
      })
      .style("stroke", (d) => {
        return "#f6f6f6";
      })
      .style("stroke-width", "6px")
      .on("mouseover", function(d, i) {
        let rect = svg.node().getBoundingClientRect();
        let yDist = Number(scaleY(d.upperSecondary)) + Number(rect.top) + Number(window.scrollY) - 70;
        let xDist = Number(rect.left) + Number(margins.left + i*lineSpacing);

        tooltip.style("position", "absolute")
          .style("display", "block")
          .style("left", (xDist - 116) + "px")
          .style("top", yDist + "px")
          .html(`<span class="tooltip__country">${d.country}</div><span class="tooltip__when">Achieved in <b></b>, before <b>${d.before}%</b> of the world</span>`);
      });

  svg.on("mouseleave", function(d, i) {
    tooltip.style("display", "none");
  });

  var targetLineGroup = svg.append("g");

  targetLineGroup.append("line")
    .attr("y1", scaleY("2030"))
    .attr("x1", 0)
    .attr("y2", scaleY("2030"))
    .attr("x2", svg.attr("width"))
    .style("stroke", "#bdbdbd")
    .style("stroke-width", "1px");

  targetLineGroup.append("text")
    .text("Target year for universal secondary education")
    .attr("y", scaleY("2030"))
    .attr("x", svg.attr("width"))
    .attr("dy", -5)
    .style("text-anchor", "end")
    .style("fill", "#bdbdbd")
    .classed("target-line-label", true);

  svg.append("g")
    .selectAll("line")
    .data(sortedData)
    .enter()
    .append("line")
      .attr("x1", (d,i) => {
        return margins.left + i*lineSpacing - 3;
      })
      .attr("x2", (d,i) => {
        return margins.left + i*lineSpacing + 3;
      })
      .attr("y1", (d,i) => {
        return scaleY(d.upperSecondary);
      })
      .attr("y2", (d,i) => {
        return scaleY(d.upperSecondary);
      })
      .style("stroke", (d) => {
        return incomeColour(d.income);
      })
      .style("stroke-width", "2px");

  svg.append("g")
    .selectAll("text.label")
    .data(sortedData)
    .enter()
    .append("text")
      .attr("y", (d) => {
        return scaleY(d.upperSecondary);
      })
      .attr("x", (d,i) => {
        return margins.left + i*lineSpacing;
      })
      .attr("dx", (d) => {
        if(Number(scaleY(d.upperSecondary)) <= Number(scaleY("2030"))) {
          return Number(scaleY(d.upperSecondary)) - Number(scaleY("2030")) - 5;
        } else {
          return Number(scaleY(d.upperSecondary)) - Number(scaleY("2030")) + 5;
        }
      })
      .text(d => d.country)
      .style("fill", "#bdbdbd")
      .classed("country-label", true)
      .style("display", "none")
      .attr("data-code", d => d.code3)
      .style("dominant-baseline", "central")
      .style("text-anchor", (d) => {
        if(Number(scaleY(d.upperSecondary)) <= Number(scaleY("2030"))) {
          return "end";
        } else {
          return "start";
        }
      })
      .attr("transform", (d,i) => {
        return "rotate(-90," + (margins.left + i*lineSpacing) + "," + scaleY(d.upperSecondary) + ")";
      });


    svg.append("text")
      .text("Years behind target")
      .attr("x", svg.attr("width") - 40)
      .attr("y", scaleY("2065"))
      .style("text-anchor", "end")
      .style("fill", "#767676")
      .style("stroke", "#fff")
      .style("stroke-width", "3px")
      .classed("target-label", true);

    svg.append("text")
      .text("Years behind target")
      .attr("x", svg.attr("width") - 40)
      .attr("y", scaleY("2065"))
      .style("text-anchor", "end")
      .style("fill", "#767676")
      .classed("target-label", true);
  }