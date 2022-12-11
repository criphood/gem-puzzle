import './styles/styles.css';
import './styles/scss.scss';
import { createElement } from 'react';

'use strict';
const body = document.querySelector('body');
let interval,
    itemNodes;


// Local Storage
let puzzleConfig;

if (localStorage.getItem('puzzleConfig') !== null) {
    puzzleConfig = getPuzzleConfig();
} else {
    puzzleConfig = {
        duration: 0,
        counter: 0,
        countItems: 16,
        isGaming: false,
        playSound: true,
        matrix: null,
        topResultsList: []
    }
}

function setPuzzleConfig() {
    return (localStorage.setItem('puzzleConfig', JSON.stringify(puzzleConfig)));
}

function getPuzzleConfig() {
    return JSON.parse(localStorage.getItem('puzzleConfig'));
}


// Options
const options = createBlock(body, 'options', 'div');

options.innerHTML = `
    <button class="start">Start</button>
    <button class="reset">Reset</button>
    <button class="sound">Sound</button>
    <button class="results">Results</button>
`;

let start, reset, sound, results;

for (const item of options.children) {
    if (item.matches('.start')) start = item;
    if (item.matches('.reset')) reset = item;
    if (item.matches('.sound')) sound = item;
    if (item.matches('.results')) results = item;
}

// Render Top
const modalWrapper = createBlock(body, 'modal-wrapper', 'div');
const modalOverlay = createBlock(modalWrapper, 'modal-overlay', 'div');
const modal = createBlock(modalOverlay, 'modal', 'div');
const header = createBlock(modal, 'header', 'h1');
let top = [];
let modalItem;

header.innerHTML = 'Top Players';



// Progress
const progress = createBlock(body, 'progress', 'div');
const containerMoves = createBlock(progress, 'container_moves', 'div');
const containerTime = createBlock(progress, 'container_time', 'div');


function setMovesCounter() {
    containerMoves.innerHTML = `
        <span>Moves: </span>
        <span>${puzzleConfig.counter}</span>
    `;
}

function setDuration() {
    interval = setInterval(() => {
        puzzleConfig.duration += 1;
        setTimer();
        setPuzzleConfig()
    }, 1000);

    return interval;
}

function resetDuration() {
    puzzleConfig.duration = 0;
    setTimer();
    clearInterval(interval);
}


function setTimer() {
    let minutes = Math.floor(puzzleConfig.duration / 60),
        seconds = puzzleConfig.duration % 60;

    if (minutes.toString().length === 1) minutes = `0${minutes}`;
    if (seconds.toString().length === 1) seconds = `0${seconds}`;
    placeTimeToHTML(minutes, seconds);
}

function placeTimeToHTML(minutes, seconds) {
    containerTime.innerHTML = `
        <span>Time: </span>
        <span>${minutes}:${seconds}</span>
    `;
}

if (puzzleConfig.isGaming) {
    setDuration();
}

setTimer();

// Container
const wrapper = createBlock(body, 'wrapper', 'div');

// Sound accompaniment
const accompaniment = new Audio('./assets/movement.mp3');

sound.addEventListener('click', () => {
    if (puzzleConfig.playSound === true) {
        puzzleConfig.playSound = false;
        sound.style.background = 'red';
        sound.style.color = '#fff';
    } else {
        puzzleConfig.playSound = true;
        sound.style.color = '#000';
        sound.style.background = '#f5f5f5';
    }
    setPuzzleConfig();
});


// Other sizes
const otherSizes = createBlock(body, 'other_sizes', 'div');

otherSizes.innerHTML = `
    <button data-size='3'>3x3</button>
    <button data-size='4'>4x4</button>
    <button data-size='5'>5x5</button>
    <button data-size='6'>6x6</button>
    <button data-size='7'>7x7</button>
    <button data-size='8'>8x8</button>
`;

otherSizes.children[Math.sqrt(puzzleConfig.countItems) - 3].classList.add('active');


function createBlock(parent, className, block) {
    const item = document.createElement(block);
    item.classList.add(className);
    parent.append(item);
    return item;
}



// Change size
const sizeChangers = otherSizes.querySelectorAll('button');

sizeChangers.forEach(item => {
    item.addEventListener('click', () => {
        puzzleConfig.isGaming = false;
        puzzleConfig.matrix = null;
        puzzleConfig.countItems = Math.pow(+item.dataset.size, 2);
        setPuzzleConfig();

        document.querySelector('.puzzle_container').remove();

        for (const button of sizeChangers) {
            button.classList.remove('active');
        }

        item.classList.add('active');

        puzzleConfig.counter = 0;
        resetDuration();
        render();
        puzzleConfig.matrix = null;
        setPuzzleConfig();



        
    });
});


// Layout
render();

function render() {

    const containerNode = createBlock(wrapper, 'puzzle_container', 'div');

    setMovesCounter();
    //  Append Items
    function appendItems() {
        for (let i = 1; i <= puzzleConfig.countItems; i++) {
            const itemNode = document.createElement('button');
            itemNode.classList.add('puzzle_block');
            if (!puzzleConfig.isGaming) itemNode.classList.add('inactive');
            itemNode.innerHTML = `<span>${i}`;
            itemNode.draggable = true;
            itemNode.dataset.matrix_id = `${i}`;
            containerNode.append(itemNode);
        }
        itemNodes = Array.from(containerNode.querySelectorAll('.puzzle_block'))
    }

    appendItems();


    let itemSize = (100 / Math.sqrt(puzzleConfig.countItems)).toFixed(3);

    for (let i = 0; i < containerNode.childNodes.length; i++) {
        containerNode.childNodes[i].style.width = `${itemSize}%`;
        containerNode.childNodes[i].style.height = `${itemSize}%`;
    }


    // Position
    const biggestItem = itemNodes[puzzleConfig.countItems - 1];
    biggestItem.style.display = 'none';

    let matrix = getMatrix(
        itemNodes.map(item => +item.dataset.matrix_id)
    );

    setPositionItems(matrix);

    // Shuffle
    function shuffle() {
        const shuffledArray = shuffleArray(matrix.flat());
        // const shuffledArray = matrix.flat();

        if (getPuzzleConfig() && getPuzzleConfig().matrix !== null) {
            matrix = getPuzzleConfig().matrix;
            setPositionItems(matrix);
        } else {
            matrix = getMatrix(shuffledArray);
            if (isSolvable(matrix)) {
                setPositionItems(matrix);
            } else {
                shuffle();
            }
        }
    }

    function isSolvable(x) {
        let count = 0, row = 0;
        const max = Math.max.apply(null, x.flat()),
            flat = x.flat();

        for (let i = 0; i < x.length; i++) {
            for (let j = 0; j < x[i].length; j++) {
                if (x[i][j] === max) {
                    row += i + 1;
                    count += row;
                }
            }
        }

        for (let i = 0; i < flat.length; i++) {
            const sliced = flat.slice(i);
            sliced.forEach((item) => {
                if (item < sliced[0] && sliced[0] !== max) {
                    count++;
                };
            });
        }

        if (x.length % 2 === 0) {
            return count % 2 === 0;
        } else {
            if (row % 2 === 0) {
                return count % 2 === 0;
            } else {
                return !(count % 2 === 0);
            }
        }
    }

    shuffle();

    if (puzzleConfig.playSound) {
        sound.style.background = '#f5f5f5';
        sound.style.color = '#000';
    } else {
        sound.style.background = 'red';
        sound.style.color = '#fff';
    }

    // Change position by click
    const blankNumber = +biggestItem.dataset.matrix_id;

    start.addEventListener('click', () => {
        puzzleConfig.isGaming = true;
        puzzleConfig.matrix = null;
        puzzleConfig.counter = 0;
        setPuzzleConfig();
        resetDuration();
        setMovesCounter();
        setDuration();

        matrix = getMatrix(
            itemNodes.map(item => +item.dataset.matrix_id)
        );

        shuffle();

        for (const item of containerNode.children) {
            item.classList.remove('inactive');
        }

        puzzleConfig.matrix = matrix;
        setPuzzleConfig();
    });

    reset.addEventListener('click', () => {
        puzzleConfig.isGaming = false;
        puzzleConfig.counter = 0;
        puzzleConfig.matrix = null;
        resetDuration();
        setMovesCounter();
        setPuzzleConfig();
        for (const item of containerNode.children) {
            item.classList.add('inactive');
        }
    });

    const clickListener = (event) => {
        const buttonNode = event.target.closest('button');
        if (!buttonNode) return;

        const buttonNumber = +buttonNode.dataset.matrix_id;
        moveItem(buttonNumber);
        puzzleConfig.matrix = matrix;
        setPuzzleConfig();
    }

    const dropListener = (event) => {
        const buttonNode = event.dataTransfer.getData('id');
        if (!buttonNode) return;

        const buttonNumber = +buttonNode;
        moveItem(buttonNumber);
        puzzleConfig.matrix = matrix;
        setPuzzleConfig();
    }

    containerNode.ondragover = allowDrop;

    for (const item of containerNode.children) {
        item.ondragstart = drag;
    }

    containerNode.addEventListener('click', clickListener);
    containerNode.addEventListener('drop', dropListener)

    function moveItem(buttonNumber) {
        const buttonCoords = findCoordsByNumber(buttonNumber, matrix);
        const blankCoords = findCoordsByNumber(blankNumber, matrix);
        const isValid = isValidForSwap(buttonCoords, blankCoords);

        if (isValid) {
            if (puzzleConfig.playSound) accompaniment.play();
            swap(blankCoords, buttonCoords, matrix);
            setPositionItems(matrix);
            puzzleConfig.counter++;
            setPuzzleConfig();
        }
        setMovesCounter();
    }

    function allowDrop(event) {
        event.preventDefault();
    }

    function drag(event) {
        event.dataTransfer.setData('id', event.target.dataset.matrix_id);
    }

    // Show win
    const winFlatArr =
        new Array(itemNodes.length)
            .fill(0)
            .map((_item, i) => i + 1);


    // Helpers
    function getMatrix(arr) {
        const matrix = [];
        for (let i = 0; i < Math.sqrt(puzzleConfig.countItems); i++) {
            matrix.push([]);
        }

        let x = 0, y = 0;

        for (let i = 0; i < arr.length; i++) {
            if (x >= matrix.length) {
                y++;
                x = 0;
            }

            matrix[y][x] = arr[i];
            x++;
        }

        return matrix;
    }

    function setPositionItems(matrix) {
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                const value = matrix[y][x];
                const node = itemNodes[value - 1];
                setNodeStyles(node, x, y);
            }
        }
    }

    function setNodeStyles(node, x, y) {
        const shiftPs = 100;
        node.style.transform = `translate3D(${x * shiftPs}%, ${y * shiftPs}%, 0)`
    }

    function shuffleArray(arr) {
        return arr
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
    }

    function findCoordsByNumber(num, matrix) {
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] === num) return { x, y }
            }
        }
        return null;
    }

    function isValidForSwap(coords1, coords2) {
        const diffX = Math.abs(coords1.x - coords2.x);
        const diffY = Math.abs(coords1.y - coords2.y);

        return (diffX === 1 || diffY === 1)
            && (coords1.x === coords2.x || coords1.y === coords2.y);
    }

    function swap(coords1, coords2, matrix) {
        const coords1Number = matrix[coords1.y][coords1.x];
        matrix[coords1.y][coords1.x] = matrix[coords2.y][coords2.x];
        matrix[coords2.y][coords2.x] = coords1Number;

        if (isWon(matrix)) {
            addWonClass();
        }
    }

    function isWon(matrix) {
        const flatMatrix = matrix.flat();
        for (let i = 0; i < winFlatArr.length; i++) {
            if (flatMatrix[i] !== winFlatArr[i]) {
                return false;
            }
        }

        return true;
    }

    function saveTopResults(time, moves) {
        let list = puzzleConfig.topResultsList,
            movesArr = [];
        const result = {},
            name = prompt('Input your name', 'Player');

        for (const item of list) {
            movesArr.push(item.moves);
        }

        const max = Math.max.apply(null, movesArr);

        if (name === null) {
            result.name = 'noName';
        } else {
            result.name = name;
        }
        result.time = time;
        result.moves = moves;

        if (list.length < 10) {
            list.push(result);
        } else {
            for (let i = 0; i < list.length; i++) {
                if (list[i].moves === max) {
                    list.splice(i, 1, result);
                }
            }
        }

        list.sort((a, b) => {
            if (a.moves < b.moves) {
                return -1;
            }
        });

        setPuzzleConfig();
    }





    
    results.addEventListener('click', () => {

        const newCards = document.querySelectorAll('.modal-item');
        for (let i = 0; i < newCards.length; i++) {
            newCards[i].remove();
        }

        renderTopList();
        modal.classList.add('modal--visible');
        modalOverlay.classList.add('modal-overlay--visible');

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('modal-overlay--visible');
            }
        })
    });

    

    function renderTopList() {
        const list = puzzleConfig.topResultsList;

        top = [];

        for (let i = 0; i < list.length; i++) {
            top.push(`${i + 1}. ${list[i].name} with ${list[i].moves} moves`)
        }

        for (const item of top) {
            modalItem = createBlock(modal, 'modal-item', 'div');
            modalItem.append(item);
        }
    }

    function addWonClass() {
        clearInterval(interval);
        containerNode.removeEventListener('click', clickListener);

        setTimeout(() => {
            containerNode.classList.add('winner');

            setTimeout(() => {
                containerNode.classList.remove('winner');

                setTimeout(() => {
                    for (const item of containerNode.children) {
                        item.classList.add('inactive');
                    }

                    const duration = containerTime.children[1].textContent;
                    alert(`Hooray! You solved the puzzle in ${duration} and ${puzzleConfig.counter} moves!`);
                    saveTopResults(duration, puzzleConfig.counter);

                    puzzleConfig.isGaming = false;
                    puzzleConfig.counter = 0;
                    puzzleConfig.matrix = null;
                    setMovesCounter();
                    resetDuration();
                    setPuzzleConfig();

                    containerNode.addEventListener('click', clickListener);
                }, 300);
            }, 1000);
        }, 500);
    }
}