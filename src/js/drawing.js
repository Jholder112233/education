import { select, selectAll, mouse } from 'd3-selection'
import { csvParse } from 'd3-dsv'
import { scaleLinear, scaleSqrt } from 'd3-scale'
import { axisTop, axisLeft, axisBottom } from 'd3-axis'
import { format } from 'd3-format'
import { transition } from 'd3-transition'
import { easeCubic, easeElasticOut, easeExpIn, easeBackOut, easeBounceOut, easePolyIn } from 'd3-ease' 
import { packSiblings, packEnclose } from 'd3-hierarchy'
import { line } from 'd3-shape'

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

export function calcBefore(country, data, attr) {
  let beforeNumber = data.filter((row) => {
    return Number(row[attr]) > Number(country[attr]);
  }).length;

  return ((beforeNumber/(data.length-1)) * 100).toFixed(1);
}

export function calcTargetYears(country, attr, target) {
  let years = country[attr] - target;

  return years.toFixed(0);
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
          .style("left", (event.pageX - 126) + "px")
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


export function drawBlockThree(svg, data, attr, targetLineLabel, targetLineYear) {
  const margins = {
    left: 60,
    right: 0
  }

  const circleSize = 1;

  const lineSpacing = ((svg.attr("width") - margins.left)/data.length); 

  let sortedData = data.sort((a,b) => {
    return Number(a[attr]) - Number(b[attr]);
  }).map((country) => {
    let before = calcBefore(country, data, attr);
    let targetYears = calcTargetYears(country, attr, targetLineYear);
    let educationLevel = (attr === "primary") ? "universal primary education" : "universal secondary education";
    return {...country, before, educationLevel, targetYears};
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
        return scaleY(targetLineYear);
      })
      .attr("x1", (d,i) => {
        return margins.left + i*lineSpacing;
      })
      .attr("y2", (d) => {
        if(Number(scaleY(d[attr])) > Number(scaleY(targetLineYear))) {
          return Number(scaleY(d[attr])) - circleSize;
        } else if(Number(scaleY(d[attr])) === Number(scaleY(targetLineYear))) {
          return scaleY(targetLineYear);
        } else {
          return Number(scaleY(d[attr])) + circleSize;
        }
      })
      .attr("x2", (d,i) => {
        return margins.left + i*lineSpacing;
      })
      .style("stroke", (d) => {
        return "#f6f6f6";
      })
      .style("stroke-width", "6px")
      .attr("data-code", d => d.code3);

    var targetLineGroup = svg.append("g");
    
    targetLineGroup.append("line")
      .attr("y1", scaleY(targetLineYear))
      .attr("x1", 0)
      .attr("y2", scaleY(targetLineYear))
      .attr("x2", svg.attr("width"))
      .style("stroke", "#bdbdbd")
      .style("stroke-width", "1px")
      .style("pointer-events", "none");
    
    targetLineGroup.append("text")
      .text(targetLineLabel)
      .attr("y", scaleY(targetLineYear))
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
        .attr("data-code", d => d.code3)
        .attr("x1", (d,i) => {
          return margins.left + i*lineSpacing - 3;
        })
        .attr("x2", (d,i) => {
          return margins.left + i*lineSpacing + 3;
        })
        .attr("y1", (d,i) => {
          return scaleY(d[attr]);
        })
        .attr("y2", (d,i) => {
          return scaleY(d[attr]);
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
          return scaleY(d[attr]);
        })
        .attr("x", (d,i) => {
          return margins.left + i*lineSpacing;
        })
        .attr("dx", (d) => {
          if(Number(scaleY(d[attr])) <= Number(scaleY(targetLineYear))) {
            return Number(scaleY(d[attr])) - Number(scaleY(targetLineYear)) - 5;
          } else {
            return Number(scaleY(d[attr])) - Number(scaleY(targetLineYear)) + 5;
          }
        })
        .text(d => d.country)
        .style("fill", "#bdbdbd")
        .style("dominant-baseline", "central")
        .style("text-anchor", (d) => {
          if(Number(scaleY(d[attr])) <= Number(scaleY(targetLineYear))) {
            return "end";
          } else {
            return "start";
          }
        })
        .attr("transform", (d,i) => {
          return "rotate(-90," + (margins.left + i*lineSpacing) + "," + scaleY(d[attr]) + ")";
        })
        .attr("data-code", d => d.code3)
        .classed("country-label", true)
        .style("display", "none");

    svg.append("text")
      .text("Years behind target")
      .attr("x", svg.attr("width") - 40)
      .attr("y", scaleY(targetLineYear + 30))
      .style("text-anchor", "end")
      .style("fill", "#767676")
      .style("stroke", "#fff")
      .style("stroke-width", "3px")
      .classed("target-label", true);

    svg.append("text")
      .text("Years behind target")
      .attr("x", svg.attr("width") - 40)
      .attr("y", scaleY(targetLineYear + 30))
      .style("text-anchor", "end")
      .style("fill", "#767676")
      .classed("target-label", true);

    if(attr === "primary") {
      svg.append("text")
        .text("Years ahead of target")
        .attr("x", 80)
        .attr("y", scaleY("1995"))
        .style("fill", "#767676")
        .style("stroke", "#fff")
        .style("stroke-width", "3px")
        .classed("target-label", true);

      svg.append("text")
        .text("Years ahead of target")
        .attr("x", 80)
        .attr("y", scaleY("1995"))
        .style("fill", "#767676")
        .classed("target-label", true);
    }

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
        .on("mouseover", function(d, i) {
          let year = d[attr];
          let achieveMessage = (Number(year) > targetLineYear) ? "Forecast to achieve" : "Achieved";

          let yearsMessage = (d.targetYears > 0) ? "behind target" : "ahead of target";

          let rect = svg.node().getBoundingClientRect();
          let yDist = Number(scaleY(d[attr])) + Number(rect.top) + Number(window.scrollY) - 70;
          let xDist = Number(rect.left) + Number(margins.left + i*lineSpacing);

          tooltip.style("position", "absolute")
            .style("display", "block")
            .style("left", (xDist - 126) + "px")
            .style("top", yDist + "px")
            .html(`<span class="tooltip__country">${d.country}</div><span class="tooltip__when">${achieveMessage} ${d.educationLevel} in <b>${year}</b>, <b>${Math.abs(d.targetYears)} years</b> ${yearsMessage}</span>`);
        });

    // svg.append("g")
    //   .selectAll("circle")
    //   .data(sortedData)
    //   .enter()
    //   .append("circle")
    //     .attr("cy", (d) => {
    //       return Number(scaleY(d[attr]));
    //     })
    //     .attr("cx", (d,i) => {
    //       return margins.left + i*lineSpacing;
    //     })
    //     .attr("r", 3)
    //     .style("stroke", "#fff")
    //     .style("stroke-opacity", 0)
    //     .style("stroke-width", "8px")
        
    svg.on("mouseleave", function(d, i) {
      tooltip.style("display", "none");
    });

  }

export function drawInfantMortality(svg, data) {
  const circleR = 10;
  const lineSpacing = 48;
  const marginTop = 30;

  svg.style("margin-top", "24px").style("margin-bottom", "48px");

  let scaleX = scaleLinear()
    .domain([0, 100])
    .range([5, svg.attr("width") - 5]);

  let axis = axisTop(scaleX);

  svg.append("g")
    .call(axis)
    .style("transform", "translateY(" + marginTop + "px)");
  
  svg.append("g").classed("tick", true)
    .append("text")
    .text("Deaths of children under 5 for every 1,000 live births")
    .attr("x", 1)
    .attr("y", 0)
    .style("fill", "#767676")
    .style("text-anchor", "start");

  svg.selectAll(".tick line").attr("y2", svg.attr("height")).attr("y1", 0)
    .style("stroke", "#e9e9e9")
    .style("stroke-dasharray", ("1,1"));

  svg.selectAll(".domain").remove();

  let group = svg.append("g")
    .selectAll("circle")
    .data(data)
    .enter();

  group.append("line")
    .attr("x1", d => scaleX(d.trend))
    .attr("x2", d => scaleX(d.sdg))
    .attr("y1", (d, i) => i * lineSpacing + 20 + marginTop)
    .attr("y2", (d, i) => i * lineSpacing + 20 + marginTop)
    .style("stroke", "#f6f6f6")
    .style("stroke-width", "22px");

  group.append("circle")
    .attr("r", circleR)
    .attr("cx", d => scaleX(d.trend))
    .attr("cy", (d, i) => {
      if(d.sdg === d.trend) {
        return i * lineSpacing + 20 + marginTop + 2.5; 
      }
      return i * lineSpacing + 20 + marginTop; 
    })
    .style("fill", "#fff")
    .style("stroke", "#cc2b12")
    .style("stroke-width", "1px");

  group.append("circle")
    .attr("r", circleR)
    .attr("cx", (d) => {
      return scaleX(d.sdg)
    })
    .attr("cy", (d, i) => {
      if(d.sdg === d.trend) {
        return i * lineSpacing + 20 + marginTop - 2.5; 
      }
      return i * lineSpacing + 20 + marginTop; 
    })
    .style("fill", "#ffffff")
    .style("stroke", "#63717a")
    .style("stroke-width", "1px");

  group.append("text")
    .text(d => d.country)
    .attr("x", d => scaleX(d.trend))
    .attr("y", (d, i) => i * lineSpacing + 20 + marginTop)
    .attr("dx", 15)
    .attr("dy", 5)
    .style("fill", "#767676");
}

export function drawPoverty(svg, data) {
  let margins = {
    left: 40,
    bottom: 20,
    top: 20,
    right: 0
  };

  var xScale = scaleLinear()
    .domain([2020, 2060])
    .range([margins.left, svg.attr("width") - margins.right]); 

  var yScale = scaleLinear()
    .domain([0,45])
    .range([svg.attr("height") - margins.bottom, margins.top]);

  let line1Data = [];
  let line2Data = [];

  for(var i = 1; i < data[0].length; i++) {
    line1Data.push({
      "year": data[0][i],
      "point": data[1][i]
    });

    line2Data.push({
      "year": data[0][i],
      "point": data[2][i]
    });
  }

  let axis = axisBottom(xScale).tickFormat(format("d"));
  let axis2 = axisLeft(yScale);

  svg.append("g").call(axis);

  svg.selectAll(".tick line").attr("y2", svg.attr("height") - margins.bottom).attr("y1", margins.top)
    .style("stroke", "#e9e9e9")
    .style("stroke-dasharray", ("1,1"));

  svg.selectAll(".tick text").attr("y", svg.attr("height") - margins.bottom + 10);

  svg.select(".domain").remove();

  svg.append("g").classed("left-axis", true).call(axis2).select(".domain").remove();

  svg.selectAll(".left-axis .tick line").attr("x2", svg.attr("width")).attr("x1", 0)
    .style("stroke", "#e9e9e9")
    .style("stroke-dasharray", ("1,1"));

  svg.selectAll(".left-axis .tick text")
    .style("text-anchor", "start")
    .attr("x", 0)
    .attr("dy", -4);
    
  var genLine = line()
    .x(function(d) { return xScale(d.year); })
    .y(function(d) { return yScale(d.point); });

  svg.append("path")
    .attr("class", "line")
    .attr("d", genLine(line1Data))
    .style("stroke", "#cc2b12")
    .style("stroke-width", "1.25px")
    .style("fill", "none");

  svg.append("path")
    .attr("class", "line")
    .attr("d", genLine(line2Data))
    .style("stroke", "#484f53")
    .style("stroke-width", "1.25px")
    .style("fill", "none");

  svg.append("g").classed("tick", true)
    .append("text")
    .text("% of population living below national poverty line")
    .attr("x", 20)
    .attr("y", margins.top - 4)
    .style("fill", "#767676")
    .style("text-anchor", "start");
}