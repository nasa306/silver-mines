let silver = 0;
let timecounter = 0;
let housecost = 20;
const storydiv = document.getElementById("story");
const buttonsdiv = document.getElementById("buttons");
const silverdisp = document.getElementById("silver");
const populationdisp = document.getElementById("population");
const populationlimit = document.getElementById("populationLimit");
const daydisp = document.getElementById("day");
const idledisp = document.getElementById("idle");
const otheridledisp = document.getElementById("sameidlebutwontworkifireuseforsomereason");
const minerdisp = document.getElementById("miners");
const soldierdisp = document.getElementById("soldiers");
const logdiv = document.getElementById("log");
let population = 0, maxpopulation = 10, soldiers = 0, miners = 0, ownedMines = 1, day = 1;
const storyData = {
    // test storyline
    start:{
        text:"start of game - test",
        choices:[
            {text:"Go to the mine", next:"mine", silver:10},
            {text:"Rest at home", next:"base"}
        ]
    },
    mine:{
        text:"You go to the mine and find some silver.",
        choices:[
            {text:"Go back home", next:"base"}
        ]
    },
    base:{
        text:"base",
        choices:[
            {text:"Build a house (" + housecost + " silver)", interaction:"housebuilding"},
            {text:"Go mining", next:"mine", silver:10}
        ]
    },
    canbuildhouse:{
        text:"You built a house and increased your population limit.",
        choices:[
            {text:"Go back to base", next:"base"}
        ]
    },
    cannotbuildhouse:{
        text:"You don't have enough silver to build a house.",
        choices:[
            {text:"Go back to base", next:"base"}
        ]
    }
};
const interactions = {
    housebuilding: function() {
        if (silver >= housecost) {
            buildHouse();
            showNode("canbuildhouse");
        } else {
            showNode("cannotbuildhouse");
        }
    }
};
console.log("test");
function updateSilver(amount){
    silver += amount;
    silverdisp.textContent = silver;
}
function addLog(text) {
    const line = document.createElement("div");
    line.textContent = text;

    logdiv.prepend(line);
}
function showNode(nodeName){
    const node = storyData[nodeName];
    if (nodeName == "housebuilding"){
        
    }
    storydiv.textContent = node.text;
    buttonsdiv.innerHTML = "";
    node.choices.forEach(choice => {
        const button = document.createElement("button");
        button.textContent = choice.text;
        button.onclick = () => {
            if (choice.silver) {
                updateSilver(choice.silver);
            }
            if (choice.next){
                showNode(choice.next);
            }
            if (choice.interaction){
                if (choice.interaction == "housebuilding"){
                    button.textContent = "Build house (" + housecost + " silver)";
                }
            }
        };
        buttonsdiv.appendChild(button);
    });
}
function getIdle(){
    return population - miners - soldiers;
}
function addMiner(){
    if (getIdle() > 0){
        miners++;
        updateUI();
    }
}
function addSoldier(){
    if (getIdle() > 0){
        soldiers++;
        updateUI();
    }
}
function unassignMiner(){
    if (miners > 0){
        miners--;
        updateUI();
    }
}
function unassignSoldier(){
    if (soldiers > 0){
        soldiers--;
        updateUI();
    }
}
function buildHouse(){
    if (silver >= housecost){
        silver -= housecost;
        maxpopulation += 4;
        housecost = Math.floor(housecost * 1.5);
        updateUI();
    }
}
function tryAddSettler() {
    if (population < maxpopulation) {
        if (Math.random() < 0.05) {
            population++;
            addLog("A person joined your town.");
        }
    }
}
function updateUI(){
    silverdisp.textContent = silver;
    populationdisp.textContent = population;
    populationlimit.textContent = maxpopulation;
    daydisp.textContent = day;
    soldierdisp.textContent = soldiers;
    minerdisp.textContent = miners;
    idledisp.textContent = getIdle();
    otheridledisp.textContent = getIdle();
}

//loop
function gameLoop(){
    silver += miners;
    silver -= soldiers;
    timecounter++;
    day = timecounter%60 == 0 ? day+1 : day;
    tryAddSettler();
    updateUI();
}
showNode("start");
setInterval(gameLoop, 1000);
