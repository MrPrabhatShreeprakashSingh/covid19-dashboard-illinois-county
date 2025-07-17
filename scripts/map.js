// scene4.js

Promise.all([
    d3.json("data/il-counties-topo.json"),
    d3.json("data/il-county-latest-summary.json")
])
.then(([topoData, covidData]) => {
    const width = 960;  // Reduced size
    const height = 600; // Reduced size

    const container = d3.select("#scene-map")
        .append("div")
        .attr("class", "chart-container")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center");

    // Dropdown for county filter
    const countyNames = [...new Set(covidData.map(d => d.county))].sort();
    const dropdown = container.append("select")
        .attr("id", "county-dropdown")
        .style("margin", "1rem")
        .style("padding", "0.4rem 0.8rem")
        .style("font-size", "0.9rem")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("background-color", "#fdfdfd")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

    dropdown.append("option").attr("value", "All Counties").text("All Counties");
    countyNames.forEach(name => {
        dropdown.append("option").attr("value", name).text(name);
    });

    const svg = container
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const counties = topojson.feature(topoData, topoData.objects.counties).features;

    const covidMap = new Map(covidData.map(d => [Math.floor(d.fips), { cases: +d.cases, name: d.county }]));

    const maxCases = d3.max(covidData, d => +d.cases);
    const color = d3.scaleSequential()
        .domain([0, maxCases])
        .interpolator(d3.interpolateTurbo);

    const projection = d3.geoAlbersUsa().fitSize([width, height], { type: "FeatureCollection", features: counties });
    const path = d3.geoPath().projection(projection);

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip-map")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("padding", "6px")
        .style("background", "#333")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none");

    const paths = svg.selectAll("path")
        .data(counties)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", d => {
            const fips = parseInt(d.id);
            const cases = covidMap.get(fips)?.cases;
            return cases ? color(cases) : "#ccc";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
            const fips = parseInt(d.id);
            const data = covidMap.get(fips);
            tooltip.style("visibility", "visible")
                .html(`<strong>${data?.name || "Unknown"} County</strong><br>Cases: ${data?.cases?.toLocaleString() ?? "No data"}`);
            d3.select(this).attr("stroke", "#000").attr("stroke-width", 1.5);
        })
        .on("mousemove", event => {
            tooltip
                .style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
            d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.5);
        });

    dropdown.on("change", function() {
        const selected = this.value;
        paths.transition().duration(500)
            .attr("opacity", d => {
                const fips = parseInt(d.id);
                const data = covidMap.get(fips);
                return (selected === "All Counties" || data?.name === selected) ? 1 : 0.2;
            })
            .attr("stroke-width", d => {
                const fips = parseInt(d.id);
                const data = covidMap.get(fips);
                return (selected === "All Counties" || data?.name === selected) ? 1.5 : 0.5;
            });
    });

    // ---- Add SVG Color Legend ----
    const legendHeight = 250;  // Reduced height to match reduced map size
    const legendWidth = 12;

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "legend-gradient-vertical")
        .attr("x1", "0%").attr("x2", "0%")
        .attr("y1", "100%").attr("y2", "0%");

    const stops = 10;
    for (let i = 0; i <= stops; i++) {
        gradient.append("stop")
            .attr("offset", `${(i / stops) * 100}%`)
            .attr("stop-color", color((i / stops) * maxCases));
    }

    const legendGroup = svg.append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${width - legendWidth - 40}, ${height / 2 - legendHeight / 2})`);

    legendGroup.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient-vertical)")
        .attr("stroke", "#000")
        .attr("rx", 3);

    const legendScale = d3.scaleLinear()
        .domain([0, maxCases])
        .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
        .ticks(6)
        .tickFormat(d3.format(".2s"));

    legendGroup.append("g")
        .attr("transform", `translate(${legendWidth}, 0)`)
        .call(legendAxis)
        .selectAll("text")
        .style("font-size", "10px")
        .style("fill", "#444");

})
.catch(error => {
    console.error("Error loading or rendering map:", error);
});
