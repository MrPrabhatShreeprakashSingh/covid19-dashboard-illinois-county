// scene4.js

Promise.all([
    d3.json("data/il-counties-topo.json"),
    d3.json("data/il-county-latest-summary.json")
]).then(([topoData, covidData]) => {
    const width = 960;
    const height = 600;

    const svg = d3.select("#scene4-map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // ✅ Using verified object name from your TopoJSON
    const counties = topojson.feature(topoData, topoData.objects.il_counties).features;

    // ✅ Prepare a FIPS->Cases map
    const covidMap = new Map(covidData.map(d => [String(d.fips).padStart(5, "0"), +d.cases]));

    const color = d3.scaleSequential()
        .domain([0, d3.max(covidData, d => +d.cases)])
        .interpolator(d3.interpolateReds);

    const projection = d3.geoAlbersUsa()
        .fitSize([width, height], { type: "FeatureCollection", features: counties });

    const path = d3.geoPath().projection(projection);

    svg.selectAll("path")
        .data(counties)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", d => {
            const fips = d.id;
            const cases = covidMap.get(fips);
            return cases ? color(cases) : "#eee";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .append("title")
        .text(d => {
            const fips = d.id;
            const cases = covidMap.get(fips) || 0;
            return `${d.properties.name}: ${cases.toLocaleString()} cases`;
        });

}).catch(err => {
    console.error("Error loading or rendering map:", err);
});
