import { select, selectAll, mouse } from 'd3-selection'
import { csvParse } from 'd3-dsv'
import { scaleLinear, scaleSqrt } from 'd3-scale'
import { axisTop, axisLeft, axisBottom } from 'd3-axis'
import { format } from 'd3-format'
import { transition } from 'd3-transition'
import { easeCubic, easeElasticOut, easeExpIn, easeBackOut, easeBounceOut, easePolyIn } from 'd3-ease'
import { packSiblings, packEnclose } from 'd3-hierarchy'
import { line, area } from 'd3-shape'
import throttle from './lib/throttle'

var header = document.getElementById("header");

export function incomeColour(incomeGroup) {
  var colour;
  switch(incomeGroup) {
    case "a":
        colour = "#39a4d8";
        break;
    case "b":
        colour = "#fdd09e";
        break;
    case "c":
        colour = "#ed3d61";
        break;
    default:
        colour = "#bdbdbd";
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

export function drawCircle(svg, data, title, el, containerWidth) {
  let mobile = containerWidth <= 740;
  let headerHeight = (header) ? header.clientHeight : 0;
  const padding = 1.5;

  let circles = packSiblings(data);
  let bigCircle = packEnclose(circles);
  let totalEl = el.select(".count");
  let tooltip = select(".tooltip");

  let incomeElObj = {
    "c": el.select(".low"),
    "b": el.select(".middle"),
    "a": el.select(".high")
  };

  svg.append("g").append("circle")
    .attr("cx", bigCircle.x )
    .attr("cy", bigCircle.y )
    .attr("r", bigCircle.r )
    .style("fill", "#f6f6f6")
    .style("fill-opacity", "0.75");

  if(mobile) {
    svg.attr("height", ((bigCircle.r*2) + 48));
  }

  let circleG = svg.append("g").selectAll("circle")
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

        let headerOffset = window.scrollY + Number(svg.node().parentNode.parentNode.offsetParent.getBoundingClientRect().top);
        let verticalOffset = (Number(year) > 2015) ? event.pageY - 84 - headerOffset: event.pageY - 72 - headerOffset;

        tooltip.style("position", "absolute")
          .style("display", "block")
          .style("left", (event.pageX - 126) + "px")
          .style("top", verticalOffset + "px")
          .html(`<span class="tooltip__country">${d.country}</div><span class="tooltip__when">${achieveMessage} ${d.educationLevel} in <b>${year}</b>, before <b>${d.before}%</b> of the world</span>`);
      })
      .on("mouseout", function(d) {
        tooltip.style("display", "none");
      })


  let textG = svg.append("g").selectAll("text")
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
      });

  var animated = false;
  var screenHeight = window.innerHeight;

  function doAnimation(isMobile) {
    var duration = 1;

    if(isMobile === true) {
      duration = 0;
    }

    if((isMobile && !animated) || (!animated && (svg.node().getBoundingClientRect().bottom + 100 < screenHeight || svg.node().getBoundingClientRect().top < 0))) {
      animated = true;
      circleG.transition()
        .ease(easeElasticOut)
        .delay(function(d, i) { return (500 + (i * 25))*duration; })
        .duration(1200*duration)
        .attr("r", (d, i) => {
          setTimeout(() => {
            let newCountTotal = Number(totalEl.html()) + 1;
            if(d.income !== "Not classified") {
              let newIncomeTotal = Number(incomeElObj[d.income].html()) + 1;
              incomeElObj[d.income].html(newIncomeTotal);
            }
            totalEl.html(newCountTotal);
          }, (500+(i * 25))*duration);

          return d.r - padding
        });

      textG.transition()
        .delay(function(d, i) { return ((i * 25) + 500 + 500)*duration; })
        .duration(300*duration)
        .style("opacity", (d) => {
          if(d.r > 12) {
            return 1;
          } else {
            return 0;
          }
        });
    }
  }

  if(!mobile) {
    doAnimation();
    window.addEventListener("scroll", throttle(doAnimation, 100));
  } else {
    doAnimation(true);
  }

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
  let mobile = false;

  const margins = {
    left: 20,
    right: 20,
    top: 24,
    bottom: 12
  }

  const lineSpacing = 9;

  if(mobile) {
    let height = Math.max(window.innerHeight, 300) - margins.top - margins.bottom;
    svg.attr("width", (data.length * 15) + margins.left + margins.right);
    svg.attr("height", height);
  }

  console.log(data);

  let sortedData = data
  // .sort((a,b) => {
  //   var textA = a.income.toUpperCase();
  //   var textB = b.income.toUpperCase();
  //   return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
  // })
  // .sort((a,b) => {
  //   return Number(a[attr]) - Number(b[attr]);
  // })
  // .filter((obj) => {
  //   return obj.income === "Low income";
  // })
  .sort((a,b) => {
    if(Number(a[attr]) !== Number(b[attr])) {
      return (Number(a[attr]) - Number(b[attr]));
    } else if(a.income !== b.income) {
      var textA = a.income.toUpperCase();
      var textB = b.income.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    } else {
      var textA = a.country.toUpperCase();
      var textB = b.country.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    }
  })
  .map((country) => {
    let before = calcBefore(country, data, attr);
    let targetYears = calcTargetYears(country, attr, targetLineYear);
    let educationLevel = (attr === "primary") ? "universal primary education" : "universal secondary education";
    return {...country, before, educationLevel, targetYears};
  });

  let tooltip = select(".tooltip");

  let scaleY = scaleLinear()
    .domain([1970, 2100])
    .range([margins.top, svg.attr("height") - margins.bottom]);

  let scaleX = scaleLinear()
    .domain([1950, 2120])
    .range([margins.left, svg.attr("width") - margins.right]);

  function formatYears(d) {
    let year = Number(d);

    return Math.abs(year - targetLineYear);
  }

  let axis = axisTop(scaleX).ticks(32).tickFormat(formatYears);

  svg.style("overflow", "visible");

  svg.append("g")
    .call(axis);

  svg.selectAll(".tick line").attr("y2", svg.attr("height")).attr("y1", 0)
    .style("stroke", "#e9e9e9")
    .style("stroke-dasharray", ("1,1"));

  svg.selectAll(".domain").remove();

  svg.append("g")
    .selectAll("line")
    .data(sortedData)
    .enter()
    .append("line")
      .attr("x1", (d) => {
        return scaleX(targetLineYear);
      })
      .attr("y1", (d,i) => {
        return margins.top + i*lineSpacing;
      })
      .attr("x2", (d) => {
        if(scaleX(d[attr]) === scaleX(targetLineYear)) {
          return scaleX(targetLineYear);
        } else if(scaleX(d[attr]) < scaleX(targetLineYear)) {
          return scaleX(d[attr]) + (lineSpacing/2 - 1);
        } else {
          return scaleX(d[attr]) - (lineSpacing/2 - 1);
        }
      })
      .attr("y2", (d,i) => {
        return margins.top + i*lineSpacing;
      })
      .style("stroke", (d) => {
          // return colour(d[attr]);
          return incomeColour(d["income"]);
        })
      .style("stroke-width", 1 + "px")
      .attr("data-code", d => d.code3);

    var targetLineGroup = svg.append("g");

    targetLineGroup.append("line")
      .attr("x1", scaleX(targetLineYear))
      .attr("y1", 0)
      .attr("x2", scaleX(targetLineYear))
      .attr("y2", svg.attr("height"))
      .style("stroke", "#bdbdbd")
      .style("stroke-width", "1px")
      .style("pointer-events", "none");

    targetLineGroup.append("text")
      .text(targetLineLabel)
      .attr("x", scaleX(targetLineYear))
      .attr("y", svg.attr("height"))
      .attr("dx", -5)
      .style("text-anchor", "end")
      .style("fill", "#bdbdbd")
      .classed("target-line-label", true);

    // svg.append("g")
    //   .selectAll("line")
    //   .data(sortedData)
    //   .enter()
    //   .append("line")
    //   .attr("x1", (d) => {
    //     return scaleX(d[attr]);
    //   })
    //   .attr("x2", (d) => {
    //     return scaleX(d[attr]);
    //   })
    //   .attr("y1", (d,i) => {
    //     return margins.top + i*lineSpacing - (lineSpacing/2) + 1;
    //   })
    //   .attr("y2", (d,i) => {
    //     return margins.top + i*lineSpacing + (lineSpacing/2) - 1;
    //   })
    //   .style("stroke", (d) => {
    //     return incomeColour(d.income);
    //   })
    //   .style("stroke-width", "1px");

    svg.append("g")
      .selectAll("circle")
      .data(sortedData)
      .enter()
      .append("circle")
      .attr("cx", (d) => {
        return scaleX(d[attr]);
      })
      .attr("cy", (d,i) => {
        return margins.top + i*lineSpacing;
      })
      .attr("r", lineSpacing/2 - 1)
      .style("stroke", (d) => {
        return incomeColour(d.income);
      })
      .style("stroke-width", "1px")
      .style("fill", (d) => {
        return incomeColour(d.income);
      })
      .style("fill-opacity", "0.2");

    svg.append("g")
      .selectAll("text.label")
      .data(sortedData)
      .enter()
      .append("text")
        .attr("x", (d) => {
          return scaleX(d[attr]);
        })
        .attr("y", (d,i) => {
          return margins.top + i*lineSpacing;
        })
        .attr("dx", (d) => {
          if(Number(scaleX(d[attr])) <= Number(scaleX(targetLineYear))) {
            return -7.5;
          } else {
            return 7.5;
          }
        })
        .text(d => d.country)
        .style("fill", "#bdbdbd")
        .style("font-size", "9px")
        .style("dominant-baseline", "central")
        .style("text-anchor", (d) => {
          if(Number(scaleY(d[attr])) <= Number(scaleY(targetLineYear))) {
            return "end";
          } else {
            return "start";
          }
        })
        .attr("data-code", d => d.code3)
        .classed("country-label", true);

  }

export function drawInfantMortality(svg, data) {
  const circleR = 5;
  const lineSpacing = 48;
  const marginTop = 40;

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
    .text("Deaths of children under 5 for every 1,000 live births, 2050")
    .attr("x", 1)
    .attr("y", 4)
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
    .style("stroke-width", "11px");

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

  let key = svg.append("g");

  key.append("circle")
    .attr("r", "5")
    .attr("cx", 10)
    .attr("cy", 0)
    .style("fill", "#fff")
    .style("stroke", "#cc2b12")
    .style("stroke-width", "1px");

  key.append("text")
    .text("Trend")
    .attr("x", 25)
    .attr("y", 4)
    .style("fill", "#767676")
    .style("text-anchor", "start");

  key.append("circle")
    .attr("r", "5")
    .attr("cx", 80)
    .attr("cy", 0)
    .style("fill", "#fff")
    .style("stroke", "#63717a")
    .style("stroke-width", "1px");

  key.append("text")
    .text("SDG 4.1 met")
    .attr("x", 95)
    .attr("y", 4)
    .style("fill", "#767676")
    .style("text-anchor", "start");

  key.style("transform", "translateX(" + (Number(svg.attr("width")) - 174) + "px)");
}

export function drawPoverty(svg, data) {
  svg.style("margin-top", "24px");

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

  let lineData = [];

  for(var i = 1; i < data[0].length; i++) {
    lineData.push({
      "year": data[0][i],
      "point": data[1][i],
      "point2": data[2][i]
    });
  }

  let axis = axisBottom(xScale).tickFormat(format("d"));
  let axis2 = axisLeft(yScale);

  var genLine = line()
    .x((d) => { return xScale(d.year); })
    .y((d) => { return yScale(d.point); });

  var genLine2 = line()
    .x((d) => { return xScale(d.year); })
    .y((d) => { return yScale(d.point2); });

  var genArea = area()
    .x((d) => { return xScale(d.year); })
    .y0((d) => { return yScale(d.point); })
    .y1((d) => { return yScale(d.point2); });

  svg.append("path")
    .attr("class", "area")
    .attr("d", genArea(lineData))
    .style("fill", "#f6f6f6")
    .style("fill-opacity", "0.8");

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

  svg.append("path")
    .attr("class", "line")
    .attr("d", genLine(lineData))
    .style("stroke", "#cc2b12")
    .style("stroke-width", "1px")
    .style("fill", "none");

  svg.append("path")
    .attr("class", "line")
    .attr("d", genLine2(lineData))
    .style("stroke", "#484f53")
    .style("stroke-width", "1px")
    .style("fill", "none");

  svg.select(".left-axis .tick:last-of-type text").html("45% of population living below national poverty line");

  svg.append("g")
    .append("line")
    .attr("x1", xScale(2050))
    .attr("x2", xScale(2050))
    .attr("y1", yScale(9))
    .attr("y2", yScale(2))
    .style("stroke", "#767676")
    .style("stroke-width", "1px");

  svg.append("g")
    .selectAll("circle")
    .data(lineData)
    .enter()
    .append("circle")
    .attr("r", 5)
    .attr("cx", d => xScale(d.year))
    .attr("cy", d => yScale(d.point2))
    .style("fill", "#fff")
    // .style("fill-opacity", 0.2)
    .style("stroke", "#484f53")
    .style("stroke-width", "1px");

  svg.append("g")
    .selectAll("circle")
    .data(lineData)
    .enter()
    .append("circle")
    .attr("r", 5)
    .attr("cx", d => xScale(d.year))
    .attr("cy", d => yScale(d.point))
    .style("fill", "#fff")
    // .style("fill-opacity", 0.2)
    .style("stroke", "#cc2b12")
    .style("stroke-width", "1px");

  let tWrapper = svg.append("text")
    .attr("x", xScale(2050))
    .attr("y", 286)
    .style("font-size", "12px");

  tWrapper.append("tspan").text("A 7% gap in 2050 if");
  tWrapper.append("tspan").text("education goals aren't met").attr("dy", 13).attr("x", xScale(2050));

  let key = svg.append("g").style("font-size", "12px");

  key.append("circle")
    .attr("r", "5")
    .attr("cx", 30)
    .attr("cy", 0)
    .style("fill", "#fff")
    .style("stroke", "#cc2b12")
    .style("stroke-width", "1px");

  key.append("text")
    .text("Trend")
    .attr("x", 40)
    .attr("y", 4)
    .style("fill", "#767676")
    .style("text-anchor", "start");

  key.append("circle")
    .attr("r", "5")
    .attr("cx", 95)
    .attr("cy", 0)
    .style("fill", "#fff")
    .style("stroke", "#63717a")
    .style("stroke-width", "1px");

  key.append("text")
    .text("SDG 4.1 met")
    .attr("x", 105)
    .attr("y", 4)
    .style("fill", "#767676")
    .style("text-anchor", "start");

  key.style("transform", "translate(446px,12px)");

  // svg.append("g").classed("tick", true)
  //   .append("text")
  //   .text("% of population living below national poverty line")
  //   .attr("x", 20)
  //   .attr("y", margins.top - 4)
  //   .style("fill", "#767676")
  //   .style("text-anchor", "start");
}
