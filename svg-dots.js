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

const numberOfDots = 50;
const dotRadius = 5;
const dotSpeed = 0.1;

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

        const element = appendElement(
            svg,
            "circle",
            {
                cx: Math.round(x),
                cy: Math.round(y),
                r: dotRadius,
                fill: "black"
            }
        );

        return {
            x,
            y,
            xSpeed: (Math.random() * dotSpeed * 2) - dotSpeed,
            ySpeed: (Math.random() * dotSpeed * 2) - dotSpeed,
            element
        };
    };

    const dots = Array(numberOfDots)
        .fill(undefined)
        .map(dotFactory);

    const tick = (oldDots, oldTime) => {
        window.requestAnimationFrame(
            () => {
                const newTime = Date.now();
                const newDots = updateDots(
                    oldDots,
                    width,
                    height,
                    newTime - oldTime
                );
                tick(newDots, newTime);
            }
        );
    };

    tick(dots, Date.now());
};


const updateDots = (dots, width, height, deltaTime) => {
    return dots.map(({x, y, xSpeed, ySpeed, element}) => {
        const deltaX = xSpeed * deltaTime;
        const deltaY = ySpeed * deltaTime;
        const updated = {
            x: (x + deltaX + width) % width,
            y: (y + deltaY + height) % height,
            xSpeed,
            ySpeed,
            element
        };

        setAttributes(
            element,
            {
                cx: Math.round(updated.x),
                cy: Math.round(updated.y),
            }
        );

        return updated;
    });
};
