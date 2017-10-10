const numberOfDots = 100;
const dotRadius = 3;
const dotSpeed = 0.1;

const getLineColor = opacity => `rgba(100,100,100,${opacity})`;

const createLine = (context, x1, y1, x2, y2, opacity) => {
    context.strokeStyle = getLineColor(opacity);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
};

const createDot = (context, dot) => {
    context.fillStyle = getLineColor(1);
    context.beginPath();
    context.arc(dot.x, dot.y, dotRadius, 0, 2 * Math.PI, false);
    context.fill();
}

const getDifference = (a, b) => Math.min(Math.abs(a - b), Math.abs(b - a));

export const create = (selector) => {
    const canvas = document.querySelector(selector);

    let width;
    let height;

    const getDimensions = () => {
        width = target.clientWidth;
        height = target.clientHeight;
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
    }

    getDimensions();
    window.onresize = getDimensions;

    const context = canvas.getContext("2d");

    const dotFactory = () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        xSpeed: (Math.random() * dotSpeed * 2) - dotSpeed,
        ySpeed: (Math.random() * dotSpeed * 2) - dotSpeed,
        links: []
    });

    const dots = Array(numberOfDots)
        .fill(undefined)
        .map(dotFactory)

    // Create links between all elements.
    dots.forEach((current, index, all) => {
        all.slice(index + 1)
            .map((other) => ({
                dot1: current,
                dot2: other,
                weight: 0
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
                context.clearRect(0, 0, width, height);
                const newTime = Date.now();
                const deltaTime = newTime - oldTime;
                updateDots(
                    dots,
                    width,
                    height,
                    deltaTime,
                    context
                );
                updateLinks(
                    dots,
                    width,
                    height,
                    deltaTime,
                    context
                );
                tick(newTime);
            }
        );
    };

    tick(Date.now());
};

const updateDots = (dots, width, height, deltaTime, context) => {
    dots.forEach((dot) => {
        const deltaX = dot.xSpeed * deltaTime;
        dot.x = (dot.x + deltaX + width) % width;

        const deltaY = dot.ySpeed * deltaTime;
        dot.y = (dot.y + deltaY + height) % height;

        createDot(context, dot);
    });
};

const decay = 0.001;
const linksPerDot = 2;

const updateLinks = (dots, width, height, deltaTime, context) => {
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
                        createLine(
                            context,
                            link.dot1.x,
                            link.dot1.y,
                            link.dot2.x,
                            link.dot2.y,
                            link.weight
                        );
                    } else {
                        const is1Left = link.dot1.x < link.dot2.x;
                        const is1Above = link.dot1.y < link.dot2.y;
                        const overlapX = spansWidth ? width : 0;
                        const overlapY = spansHeight ? height : 0;
                        createLine(
                            context,
                            link.dot1.x,
                            link.dot1.y,
                            link.dot2.x + (is1Left ? -overlapX : overlapX),
                            link.dot2.y + (is1Above ? -overlapY : overlapY),
                            link.weight
                        );
                        createLine(
                            context,
                            link.dot1.x + (is1Left ? overlapX : -overlapX),
                            link.dot1.y + (is1Above ? overlapY : -overlapY),
                            link.dot2.x,
                            link.dot2.y,
                            link.weight
                        );
                    }
                }
            });
    });
}

const getTorusDistance = (a, b, wrap) => {
    const distance = Math.abs(a - b);
    return distance > (wrap / 2) ? wrap - distance : distance;
};
