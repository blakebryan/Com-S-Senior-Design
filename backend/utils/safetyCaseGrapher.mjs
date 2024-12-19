import fs from 'fs';
import * as d3 from 'd3';
import { D3Node } from 'd3-node'; // Import as a named module

// Specify the output path for the generated SVG
const outputPath = './exports/tree.svg';
const frontEndOutputPath = '../React/Public/tree.svg';

// Legend data for the SVG
const legendData = [
    { label: "Failed", color: "red" },
    { label: "Passed", color: "green" }
];

/**
 * Transforms a tree node for compatibility with D3 hierarchical data structure.
 * @param {Object} node - The tree node to transform.
 * @param {Object} node.entity - The entity data for the node.
 * @param {string} node.entity.id - The unique identifier of the node.
 * @param {boolean} node.failed - Indicates whether the node has failed.
 * @param {Array<Object>} [node.children] - The children of the node.
 * @returns {Object} - The transformed node with `id`, `failed`, and `children` properties.
 */
function transformTree(node) {
    const id = node.entity.id;
    const failed = node.failed;
    const children = node.children ? node.children.map(transformTree) : [];
    return { id, failed, children };
}

/**
 * Saves a tree structure as an SVG visualization.
 * - Creates an SVG representation of a tree using D3.js.
 * - Includes a legend to indicate the status (failed or passed) of nodes.
 * @param {Object} tree - The tree data to be visualized.
 * @param {Object} tree.rootNode - The root node of the tree.
 */
function saveTreeAsSVG(tree) {
    // Transform the tree for D3 compatibility
    const transformedTree = transformTree(tree.rootNode);
    const width = 1600;  // Width of the SVG canvas
    const height = 1200; // Height of the SVG canvas

    // Initialize D3 with D3Node
    const d3n = new D3Node();
    const svg = d3n.createSVG(width, height);

    // Set up a tree layout and map the transformed data to the layout
    const root = d3.hierarchy(transformedTree);
    const treeLayout = d3.tree().size([width - 100, height - 100]);
    treeLayout(root);

    // Draw links (edges) between nodes
    svg.selectAll("line")
        .data(root.links())
        .enter()
        .append("line")
        .attr("x1", d => d.source.x + 50)
        .attr("y1", d => d.source.y + 50)
        .attr("x2", d => d.target.x + 50)
        .attr("y2", d => d.target.y + 50)
        .attr("stroke", "#ccc");

    // Draw nodes (circles) at each point
    svg.selectAll("circle")
        .data(root.descendants())
        .enter()
        .append("circle")
        .attr("cx", d => d.x + 50)
        .attr("cy", d => d.y + 50)
        .attr("r", 10)
        .attr("fill", d => d.data.failed ? "red" : "green"); // Color nodes based on status

    // Add labels for each node
    svg.selectAll("text")
        .data(root.descendants())
        .enter()
        .append("text")
        .attr("x", d => d.x + 50)
        .attr("y", d => d.y + 40)
        .attr("text-anchor", "middle")
        .text(d => d.data.id); // Display the node's `id`

    // Draw legend (circles for status)
    svg.selectAll("legendDots")
        .data(legendData)
        .enter()
        .append("circle")
        .attr("cx", 50) // X position for circles
        .attr("cy", (d, i) => 50 + i * 25) // Y position with spacing for legend items
        .attr("r", 10)
        .style("fill", d => d.color);

    // Add labels to the legend
    svg.selectAll("legendLabels")
        .data(legendData)
        .enter()
        .append("text")
        .attr("x", 70) // X position for text
        .attr("y", (d, i) => 55 + i * 25) // Y position aligned with circles
        .text(d => d.label)
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .style("font-size", "14px");

    // Save the SVG to file
    fs.writeFileSync(outputPath, d3n.svgString());
    console.log(`SVG saved to ${outputPath}`);
    fs.writeFileSync(frontEndOutputPath, d3n.svgString());
    console.log(`SVG saved to ${frontEndOutputPath}`);
}

export { saveTreeAsSVG };
