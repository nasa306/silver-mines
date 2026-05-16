//-------------data------------//
let silver = 0;
let timecounter = 0;
let housecost = 20;
let eventActive = false;
let phase = 1;
let railroad = 0; // 0 = no railroad, 1 = railroad with company influence, -1 = railroad with local influence
let perspective = 0; // 0 = neutral, => company,  <= locals
const ownedMinesdisp = document.getElementById("ownedMines");
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
let researchedTechs = [];
let unresearchedTechs = ["Patio Process", "Stamp Mill", "Square Set Timbering", "Hydraulic Pumps", "Mercury Amalgamation", "Washoe Process", "Dynamite", "Dynamite+", "Dynamite++""];
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
            {text:"Research new techniques", interaction:"research"},
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
    research: function() {
        
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
        let gainedSilver = -1;
        let lostPopulation = Math.min(population, Math.floor(Math.random() * 5) + 1);
        for (let i = 0; i < soldiers; i++) {
            if (Math.random() < 0.5 + soldiers / (soldiers+10)) { 
                lostPopulation--;
            }
        }
        lostPopulation = Math.max(0, lostPopulation);
        population -= lostPopulation;
        let stolenSilver;
        if (lostPopulation < soldiers) {soldiers -= lostPopulation; gainedSilver = lostPopulation * 5; updateSilver(gainedSilver);}
        else {
            lostPopulation -= soldiers;
            soldiers = 0; 
            miners = Math.max(0, miners - lostPopulation);
            stolenSilver = Math.min(silver, lostPopulation * 5);
            updateSilver(0 - stolenSilver);
        }
        if (lostPopulation > 0) addLog("Bandits attacked your town! They stole " + stolenSilver + " silver and you lost " + lostPopulation + " people.");
        else addLog("Bandits attacked your town but your soldiers fought them off! You gained " + gainedSilver + " silver.");
        hideEvent();
        updateUI();
    },
    raidMineInteraction: function() {
        const successChance = 0.5 + soldiers / (soldiers + 10);
        let lostSoldiers = Math.min(soldiers, Math.floor(Math.random() * 3) + 1);
        if (Math.random() < successChance) {
            ownedMines++;
            lostSoldiers = Math.min(soldiers, 1 + Math.floor(Math.random() * 2));
            population -= lostSoldiers;
            soldiers -= lostSoldiers;
            addLog("You successfully raided the mine and now own " + ownedMines + " mines! However, you lost " + lostSoldiers + " soldiers in the process.");
        } else {
            soldiers -= lostSoldiers;
            population -= lostSoldiers;
            addLog("The raid failed! You lost " + lostSoldiers + " soldiers.");
        }
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
    },
    raidMine:{
        text:"An abandoned mine was found nearby, but it's guarded by bandits. Do you want to raid it?",
        choices:[
            {text:"Yes", interaction:"raidMineInteraction"},
            {text:"No", next:"base"}
        ]
    },
    railroadArrives:{
        text: "The railroad offers to expand into your region.",
        choices: [
            {
                text: "Accept investment",
                interaction: "railroadAccept",
                perspective: "company"
            },
            {
                text: "Reject and keep independence",
                interaction: "railroadReject",
                perspective: "locals"
            }
        ]
    }
}
console.log("test");
function updateSilver(amount){
    silver += amount;
    silverdisp.textContent = Math.floor(silver);
}
//-------------events-------------//
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
            } else if (element.next){
                hideEvent();
                showNode(element.next);
            } 
            if (element.perspective) {
                if (element.perspective === "company") {
                    perspective += 1;
                } else if (element.perspective === "locals") {
                    perspective -= 1;
                }
            }
        }
    });
}
function hideEvent(){
    eventActive = false;
    eventpopup.style.display = "none";
}
function tryshowEvent(){
    if (!eventActive && Math.random() < 0.0008 * Math.sqrt(miners) / ownedMines) {
        showEvent("minecollapse");
    } else if (!eventActive && Math.random() < 0.001 + Math.sqrt(silver) * 0.0001) {
         showEvent("bandits");
    } else if (!eventActive && Math.random() < 0.0005 + day * 0.0002 && soldiers > 10) {
        showEvent("raidMine");
    }
    if (!eventActive && phase == 2 && Math.random() < 0.0005) {
        showEvent("railroadArrives");
    }
    if (!eventActive && phase == 3 && Math.random() < 0.0005) {
        showEvent("miningCompaniesArrive");
    }
}
//-------------log systems-------------//
let logQueue = [];
function queueLog(text, chance = 1) {
    if (Math.random() < chance) {
        logQueue.push(text);
    }
}
function processLogQueue() {
    while (logQueue.length > 0) {
        addLog(logQueue.shift());
    }
}
function passiveLogs() {
    if (Math.random() < 0.1) {
        if (miners > maxpopulation * 0.75) {
            queueLog("The mines are bustling with activity.", 0.1);
        } else if (miners > maxpopulation * 0.5) {
            queueLog("The mines are busy.", 0.1);
        } else if (miners > maxpopulation * 0.1) {
            queueLog("The mines are quiet.", 0.1);
        }
        if (soldiers > maxpopulation * 0.25) {
            queueLog("Your soldiers are keeping the town safe.", 0.1);
        } else if (soldiers > maxpopulation * 0.1) {
            queueLog("Your soldiers are on patrol.", 0.1);
        } else if (soldiers > 0) {
            queueLog("Your soldiers have too much on their plate.", 0.1);
        }

        // Phase-based logs
        if (phase === 1 && population > 10 && Math.random() < 0.05){
            queueLog("The town is starting to grow.", 0.5);
        }
        if (phase == 1 && Math.random() < 0.05){
            queueLog("Rumors of silver spread east.", 0.5);
        } else if (phase == 1 && Math.random() < 0.05){
            queueLog("Prospectors arrive in small numbers.", 0.5);
        }
        if (phase == 2 && Math.random() < 0.05){
            queueLog("The settlement grows rapidly.", 0.5);
        } else if (phase == 2 && Math.random() < 0.05){
            queueLog("Merchants and gamblers arrive, bringing trade and excitement.", 0.5);

        }
    }
}
function addLog(text) {
    const line = document.createElement("div");
    line.textContent = text;
    const sep = document.createElement("div");
    sep.textContent = "-------------";

    logdiv.prepend(sep);
    logdiv.prepend(line);
    logdiv.prepend(line);
    

}
//-------------story-------------//
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
function updatePhase(){
    if (population > 25 && phase == 1) phase = 2;
    if (phase == 2 && ownedMines > 3) phase = 3;
}
//-------------population------------//
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
        housecost = Math.floor(housecost * 1.25);
        let houses = ["A new house was built.", "You built a house.", "Your town expands with a new house.", "A new home is constructed.", "🛖", "🏠", "🏘️","🏚️","🏡"];
        addLog(houses[Math.floor(Math.random() * houses.length)]);
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
        if (Math.random() < (maxpopulation - population) * 0.01) { 
            population++;
            addLog("A person joined your town.");
        }
    }
}
function updateUI(){
    silverdisp.textContent = Math.floor(silver);
    populationdisp.textContent = population;
    populationlimit.textContent = maxpopulation;
    daydisp.textContent = day;
    ownedMinesdisp.textContent = ownedMines;
    soldierdisp.textContent = soldiers;
    minerdisp.textContent = miners;
    idledisp.textContent = getIdle();
    otheridledisp.textContent = getIdle();
}

//-------------loop------------//
function gameLoop(){
    if (eventpopup.style.display == "flex") return;
    silver += miners * 0.3 * ownedMines;
    timecounter++;
    if (timecounter % 60 == 0) {
        day++;
        
        silver -= Math.floor(soldiers * 0.5);
    }
    passiveLogs();
    processLogQueue();
    tryAddSettler();
    tryshowEvent();
    updateUI();
}
showNode("start");
setInterval(gameLoop, 1000);
