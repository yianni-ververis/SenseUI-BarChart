function wrap(text, width, vars, d3) {
    text.each(function() {
        var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", -vars.label.width).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width - 20) {
                lineNumber += 1;
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                // tspan = text.append("tspan").attr("x", -vars.label.width).attr("y", y).attr("dy", lineNumber * lineHeight + dy + "em").text(word);
                tspan = text.append("tspan").attr("x", -vars.label.width).attr("y", y).attr("dy", lineNumber * lineHeight + dy + "em").text(word);
            }
        }
        // Align label at the middle of the bar
        var textHeight = text._groups[0][0].getBBox().height;
        var textY = (vars.bar.height>textHeight) ? parseInt(y) + (vars.bar.height/2) - (textHeight/2) : parseInt(y);
        $(this).find("tspan").each(function() {
            $(this).attr('y',textY);
        })
    });
}

// helper Function to round the displayed numbers
var roundNumber = function (vars, num, noPrecision) {
    //check if the string passed is number or contains formatting like 13%
    if (/^[0-9.]+$/.test(num)) {
        num = (vars.precision && !noPrecision) ? parseFloat(num).toFixed(2) : Math.round(num);
        if (num >= 1000 && num<1000000) {
            num = (vars.precision && !noPrecision) ? parseFloat(num/1000).toFixed(2) : Math.round(num/1000);
            if (/\.00$/.test(num)) {
                num = num.replace(/\.00$/,''); // Remove .00
            }
            num += 'K'; // Add the abbreviation
        } else if (num >= 1000000 && num<1000000000) {
            num = (vars.precision && !noPrecision) ? parseFloat(num/1000000).toFixed(2) : Math.round(num/1000000);
            if (/\.00$/.test(num)) {
                num = num.replace(/\.00$/,''); // Remove .00
            }
            num += 'M'; // Add the abbreviation
        } else if (num >= 1000000000 && num<1000000000000) {
            num = (vars.precision && !noPrecision) ? parseFloat(num/1000000000).toFixed(2) : Math.round(num/1000000000);
            if (/\.00$/.test(num)) {
                num = num.replace(/\.00$/,''); // Remove .00
            }
            num += 'B'; // Add the abbreviation 
            // Change to B and add T
        } else if (num >= 1000000000000) {
            num = (vars.precision && !noPrecision) ? parseFloat(num/1000000000000).toFixed(2) : Math.round(num/1000000000000);
            if (/\.00$/.test(num)) {
                num = num.replace(/\.00$/,''); // Remove .00
            }
            num += 'T'; // Add the abbreviation 
            // Change to B and add T
        }
        if (vars.symbol && vars.symbol.visible) {
            if (vars.symbol.char==="$" || vars.symbol.char==="€") {
                num = vars.symbol.char + num
            } else if (vars.symbol.char==="other") {
                if (vars.symbol.otherPosition) {
                    num = vars.symbol.other + ' ' + num;
                } else {
                    num = num + ' '  + vars.symbol.other;
                }
            } else {
                vars.symbol.char;
            }
        }
    }
    return num;
}