const svgNamespace = "http://www.w3.org/2000/svg";
const xmlNamespace = "http://www.w3.org/2000/xmlns/";

const setAttributes = (element, attributes) => {
    Object.entries(attributes).forEach(function([name, value]) {
        element.setAttribute(name, value);
    });
};

const createElement = (name, attributes) => {
    const element = document.createElementNS(svgNamespace, name);
    setAttributes(element, attributes);
    return element;
};

const appendElement = (target, name, attributes) => {
    const element = createElement(name, attributes);
    target.appendChild(element);
    return element;
};

const numberOfDots = 100;
const dotRadius = 3;
const dotSpeed = 0.1;

const getLineColor = opacity => `rgba(100, 100, 100, ${opacity})`;

const createLine = (dotA, dotB) => createElement(
    "line",
    {
        x1: Math.round(dotA.x),
        y1: Math.round(dotA.y),
        x2: Math.round(dotB.x),
        y2: Math.round(dotB.y),
        stroke: getLineColor(1),
        "stroke-width": 1
    }
)

const getDifference = (a, b) => Math.min(Math.abs(a - b), Math.abs(b - a));

export const create = (selector) => {
    const target = document.querySelector(selector);

    const width = target.clientWidth;
    const height = target.clientHeight;

    const svg = appendElement(
        target,
        "svg",
        {
            version: "1.1",
            viewBox: `0 0 ${width} ${height}`
        }
    );

    svg.setAttributeNS(xmlNamespace, "xmlns", svgNamespace);

    const dotFactory = () => {
        const x = Math.random() * width;
        const y = Math.random() * height;

        return {
            x,
            y,
            xSpeed: (Math.random() * dotSpeed * 2) - dotSpeed,
            ySpeed: (Math.random() * dotSpeed * 2) - dotSpeed,
            element: appendElement(
                svg,
                "circle",
                {
                    cx: Math.round(x),
                    cy: Math.round(y),
                    r: dotRadius,
                    fill: getLineColor(1)
                }
            ),
            links: []
        };
    };

    const dots = Array(numberOfDots)
        .fill(undefined)
        .map(dotFactory)

    // Create links between all elements.
    dots.forEach((current, index, all) => {
        all.slice(index + 1)
            .map((other) => ({
                dot1: current,
                dot2: other,
                weight: 0,
                element1: createLine(current, other),
                element2: createLine(current, other)
            }))
            .forEach((link) => {
                // Array.prototype.push(...) :(
                link.dot1.links.push(link);
                link.dot2.links.push(link);
            })
    });

    const tick = (oldTime) => {
        window.requestAnimationFrame(
            () => {
                const newTime = Date.now();
                const deltaTime = newTime - oldTime;
                updateDots(
                    dots,
                    width,
                    height,
                    deltaTime
                );
                updateLinks(
                    dots,
                    width,
                    height,
                    deltaTime,
                    svg
                );
                tick(newTime);
            }
        );
    };

    tick(Date.now());
};

const updateDots = (dots, width, height, deltaTime) => {
    dots.forEach((dot) => {
        const deltaX = dot.xSpeed * deltaTime;
        dot.x = (dot.x + deltaX + width) % width;

        const deltaY = dot.ySpeed * deltaTime;
        dot.y = (dot.y + deltaY + height) % height;

        setAttributes(
            dot.element,
            {
                cx: Math.round(dot.x),
                cy: Math.round(dot.y),
            }
        );
    });
};

const decay = 0.001;
const linksPerDot = 2;

const updateLinks = (dots, width, height, deltaTime, svg) => {
    const closeLinks = dots.reduce(
        (previous, dot) => {
            const sorted = dot.links.sort((a, b) => {
                const otherA = a.dot1 === dot ? a.dot2 : a.dot1;
                const distanceAX = getTorusDistance(dot.x, otherA.x, width);
                const distanceAY = getTorusDistance(dot.y, otherA.y, height);
                const distanceA = Math.sqrt(
                    Math.pow(distanceAX, 2) + Math.pow(distanceAY, 2)
                )
                const otherB = b.dot1 === dot ? b.dot2 : b.dot1;
                const distanceBX = getTorusDistance(dot.x, otherB.x, width);
                const distanceBY = getTorusDistance(dot.y, otherB.y, height);
                const distanceB = Math.sqrt(
                    Math.pow(distanceBX, 2) + Math.pow(distanceBY, 2)
                )
                return distanceA - distanceB;
            });
            return previous.concat(sorted.slice(0, linksPerDot));
        },
        []
    );

    const remove = element => {
        if (svg.contains(element)) {
            svg.removeChild(element);
        }
    };

    const append = element => {
        if (!svg.contains(element)) {
            svg.appendChild(element);
        }
    };

    const deltaDecay = decay * deltaTime;
    dots.forEach((dot) => {
        dot.links
            .filter((link) => link.dot1 === dot)
            .forEach((link, index, all) => {
                if (closeLinks.indexOf(link) > 0) {
                    link.weight = Math.min(1, link.weight + deltaDecay);
                } else {
                    link.weight = Math.max(0, link.weight - deltaDecay);
                }

                if (link.weight > 0) {
                    const spansWidth = getDifference(link.dot1.x, link.dot2.x) > (width / 2);
                    const spansHeight = getDifference(link.dot1.y, link.dot2.y) > (height / 2);

                    if (!spansWidth && !spansHeight) {
                        remove(link.element2);
                        setAttributes(
                            link.element1,
                            {
                                x1: Math.round(link.dot1.x),
                                y1: Math.round(link.dot1.y),
                                x2: Math.round(link.dot2.x),
                                y2: Math.round(link.dot2.y),
                                stroke: getLineColor(link.weight)
                            }
                        );
                        append(link.element1);
                    } else {
                        const is1Left = link.dot1.x < link.dot2.x;
                        const is1Above = link.dot1.y < link.dot2.y;
                        const overlapX = spansWidth ? width : 0;
                        const overlapY = spansHeight ? height : 0;
                        setAttributes(
                            link.element1,
                            {
                                x1: Math.round(link.dot1.x),
                                y1: Math.round(link.dot1.y),
                                x2: Math.round(link.dot2.x + (is1Left ? -overlapX : overlapX)),
                                y2: Math.round(link.dot2.y + (is1Above ? -overlapY : overlapY)),
                                stroke: getLineColor(link.weight)
                            }
                        );
                        append(link.element1);
                        setAttributes(
                            link.element2,
                            {
                                x1: Math.round(link.dot1.x + (is1Left ? overlapX : -overlapX)),
                                y1: Math.round(link.dot1.y + (is1Above ? overlapY : -overlapY)),
                                x2: Math.round(link.dot2.x),
                                y2: Math.round(link.dot2.y),
                                stroke: getLineColor(link.weight)
                            }
                        );
                        append(link.element2);
                    }
                } else {
                    remove(link.element1);
                    remove(link.element2);
                }
            });
    });
}

const getTorusDistance = (a, b, wrap) => {
    const distance = Math.abs(a - b);
    return distance > (wrap / 2) ? wrap - distance : distance;
};
