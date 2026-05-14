let silver = 0;
let timecounter = 0;
let housecost = 20;
let eventActive = false;
const eventpopup = document.getElementById("eventpopup");
const eventtext = document.getElementById("eventtext");
const eventbuttons = document.getElementById("eventbuttons");
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
            updateUI();
        } else {
            showNode("cannotbuildhouse");
        }
    },
    minecollapseEvent: function() {
        const lostMiners = Math.min(miners, Math.floor(Math.random() * 3) + 1);
        miners -= lostMiners;
        population -= lostMiners;
        addLog("The mine collapsed! You lost " + lostMiners + " miners.");
        hideEvent();
        updateUI();
    },
    banditAttack: function() {
        const gainedSilver = -1;
        const lostPopulation = Math.min(population, Math.floor(Math.random() * 5) + 1);
        for (let i = 0; i < soldiers; i++) {
            if (Math.random() < 0.5 + soldiers / (soldiers+10)) { 
                lostPopulation--;
            }
        }
        population -= lostPopulation;
        if (lostPopulation < soldiers) {soldiers -= lostPopulation; const gainedSilver = lostPopulation * 5; updateSilver(gainedSilver);}
        else {
            soldiers = 0; 
            lostPopulation -= soldiers;
            miners = Math.max(0, miners - lostPopulation);
            const stolenSilver = Math.min(silver, lostPopulation * 5);
            updateSilver(0 - stolenSilver);
        }
        if (lostPopulation > 0) addLog("Bandits attacked your town! They stole " + stolenSilver + " silverand you lost " + lostPopulation + " people.");
        if (gainedSilver > 0) addLog("Bandits attacked your town but your soldiers fought them off! You gained " + gainedSilver + " silver.");
        hideEvent();
        updateUI();
    }
};
const interactionText = {
  housebuilding: function(){
      return "Build a house (" + housecost + " silver)";
  }  
};
const eventsData = {
    // test events
    bandits:{
        text:"Bandits are attacking your town!",
        choices:[
            {text:"Continue", interaction:"banditAttack"}
        ]
    },
    minecollapse:{
        text:"The mine collapsed! You lost some miners.",
        choices:[
            {text:"Continue", interaction:"minecollapseEvent"}
        ]
    }
}
console.log("test");
function updateSilver(amount){
    silver += amount;
    silverdisp.textContent = silver;
}
function showEvent(eventName){
    const event = eventsData[eventName];
    eventActive = true;
    eventtext.textContent = event.text;
    eventbuttons.innerHTML = "";
    eventpopup.style.display = "flex";
    event.choices.forEach(element => {
        const button = document.createElement("button");
        button.textContent = element.text;
        eventbuttons.appendChild(button);
        button.onclick = () => {
            if (element.interaction){
                interactions[element.interaction](); 
            }
        }
    });
}
function hideEvent(){
    eventActive = false;
    eventpopup.style.display = "none";
}
function addLog(text) {
    const line = document.createElement("div");
    line.textContent = text;

    logdiv.prepend(line);
}
function showNode(nodeName){
    const node = storyData[nodeName];

    storydiv.textContent = node.text;
    buttonsdiv.innerHTML = "";
    node.choices.forEach(choice => {
        const button = document.createElement("button");
        button.textContent = choice.text;
        if (choice.interaction){
            button.textContent = interactionText[choice.interaction]();
        }
        button.onclick = () => {
            if (choice.silver) {
                updateSilver(choice.silver);
            }
            if (choice.next){
                showNode(choice.next);
            }
            if (choice.interaction){
                interactions[choice.interaction]();  // Call the function directly instead of using eval()
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
        maxpopulation += 4;
        updateSilver(0-housecost);
        housecost = Math.floor(housecost * 1.5);
        updateUI();
    }
}
function forcesettlers(amount){
    population += amount;
    if (population > maxpopulation){
        population = maxpopulation;
        for (let i = 0; i < amount; i++) {
            addLog("A person joined your town.");
        }
    }
}
function tryAddSettler() {
    if (population < maxpopulation) {
        if (Math.random() < 0.05 * (1 + population / maxpopulation)) { 
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
function tryshowEvent(){
    if (!eventActive && Math.random() < (0.0005 * Math.sqrt(miners) / ownedMines)) {
        showEvent("minecollapse");
    } else {
        if (!eventActive && Math.random() < 0.001 + Math.sqrt(silver) * 0.0001) {
            showEvent("bandits");
        }
    }
}
//loop
function gameLoop(){
    if (eventpopup.style.display == "flex") return;
    silver += miners;
    silver -= soldiers;
    timecounter++;
    day = timecounter%60 == 0 ? day+1 : day;
    tryAddSettler();
    tryshowEvent();
    updateUI();
}
showNode("start");
setInterval(gameLoop, 1000);
