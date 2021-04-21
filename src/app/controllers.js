
// Controllers of the game

class BusinessController
{
    _businessList = [];

    _timerController = null;
    _moneyController = null;
    _managerController = null;

    

    constructor(timerController, moneyController, managerController, definitionList) {
        for (let business of definitionList) {
            this._businessList.push(new RuntimeBusiness(business, business.defaultLevel));
        }

        this._timerController = timerController;
        this._moneyController = moneyController;

        this._managerController = managerController;
        this._managerController.unlockedCallback = (manager) => {
            this._managerUnlockedCallback(manager);
        };
    }


    buyBusiness(index) {
        let business = this._businessList[index];
        if (this._moneyController.canAfford(business.price)) {
            this._moneyController.consume(business.price);

            business.level++;
            this._recalculateBusinessStats(business);
        }
    }

    _recalculateBusinessStats(business) {
        let definition = business.definition;
        if (business.level > 1) {
            business.price = definition.price * business.level;
            business.revenue = definition.revenue * business.level;
        } else {
            business.price = definition.price;
            business.revenue = definition.revenue;
        }
    }


    startProcessing(index) {
        let business = this._businessList[index];
        if (business.timerId === -1) {
            business.timerId = this._timerController.startTimer(business.processingTime, 
                    (timerId, multiplier, remainingTime) => { 
                        this._timerCompletionHandler(timerId, multiplier, remainingTime); 
                    });

        }
    }

    _timerCompletionHandler(timerId, multiplier, remainingTime) {
        for (let business of this._businessList) {
            if (business.timerId === timerId) {
                business.timerId = -1;

                this._moneyController.grant(business.revenue * multiplier);

                if (business.hasManager) {
                    business.timerId = this._timerController.startTimer(business.processingTime, 
                            (timerId, multiplier, remainingTime) => { 
                                this._timerCompletionHandler(timerId, multiplier, remainingTime); 
                            }, remainingTime);
                }

                break;
            }
        }
    }

    

    _managerUnlockedCallback(manager) {
        for (let i = 0; i < this._businessList.length; i++) {
            let business = this._businessList[i];
            if (business.definition === manager.targetBusinessDef) {
                business.hasManager = true;
                if (business.timerId === -1) {
                    this.startProcessing(i);
                    break;
                }
            }
        }
    }

    

    populateUIItemList(startX, startY, managerController) {
        let itemList = [];
        let y = startY;
        for (let itemIdx = 0; itemIdx < this._businessList.length; itemIdx++) {
            let businessIndex = itemIdx;
            let business = this._businessList[itemIdx];
            let manager = this._managerController.findManager(business.definition);
            itemList.push(new BusinessUIItem(startX, y, business, manager,
                        () => { this.startProcessing(businessIndex); },
                        () => { this.buyBusiness(businessIndex); },
                        () => { this._managerController.buyManager(business.definition); }));

            y += BusinessUIItemHeight + 10;
        }

        return itemList;
    }

    

    writeLocal(localStorage) {

        let saveDataList = [];
        for (let business of this._businessList) {
            let saveData = {};
            saveData.level = business.level;
            saveData.hasManager = business.hasManager;
            if (business.timerId != -1) {
                let remainingTime = this._timerController.getRemainingTime(business.timerId);
                if (remainingTime >= 0) {
                    saveData.processing = true;
                    saveData.timer = remainingTime;

                    saveDataList.push(saveData);

                    continue;
                }
            }

            saveData.processing = false;
            saveData.timer = 0;

            saveDataList.push(saveData);
        }

        localStorage.setItem("businessData", JSON.stringify(saveDataList));
    }

    readLocal(localStorage) {
        let saveDataList = JSON.parse(localStorage.getItem("businessData"));
        if (saveDataList) {
            let indexCap = Math.min(this._businessList.length, saveDataList.length);
            for (let i = 0; i < indexCap; i++) {
                let business = this._businessList[i];
                let saveData = saveDataList[i];

                business.level = saveData.level;
                business.hasManager = saveData.hasManager;
                this._recalculateBusinessStats(business);


                if (business.timerId >= 0) {
                    this._timerController.abortTimer(business.timerId);
                    business.timerId = -1;
                }

                if (saveData.processing) {
                    let currentTime = business.processingTime - saveData.timer;
                    business.timerId = this._timerController.startTimer(business.processingTime,
                        (timerId, multiplier, remainingTime) => { 
                            this._timerCompletionHandler(timerId, multiplier, remainingTime); 
                        }, currentTime);
                }
            }
        }
    }

    

    resetAll() {
        for (let business of this._businessList) {
            business.level = business.definition.defaultLevel;
            business.hasManager = false;
            business.price = business.definition.price;
            business.revenue = business.definition.revenue;
            business.timerId = -1;
        }
    }
}



class ManagerController
{
    _managerList = [];
    _unlockedFlags = [];

    _moneyController = null;
    _unlockedCallback = null;

    

    constructor(moneyController, definitionList) {
        this._managerList = definitionList;
        for (let i = 0; i < this._managerList.length; i++) {
            this._unlockedFlags.push(false);
        }

        this._moneyController = moneyController;
    }

    buyManager(targetBusinessDef) {
        let managerIdx = this._findManagerIndex(targetBusinessDef);
        if (managerIdx >= 0 && managerIdx < this._managerList.length) {
            let manager = this._managerList[managerIdx];
            if (this._moneyController.canAfford(manager.price)) {
                this._moneyController.consume(manager.price);

                this._unlockedFlags[managerIdx] = true;
                if (this.unlockedCallback) {
                    this.unlockedCallback(manager);
                }

                return true;
            }
        }

        return false;
    }

    findManager(targetBusinessDef) {
        let managerIdx = this._findManagerIndex(targetBusinessDef);
        if (managerIdx >= 0 && managerIdx < this._managerList.length) {
            return this._managerList[managerIdx];
        }

        return null;
    }

    isUnlocked(targetBusinessDef) {
        let managerIdx = this._findManagerIndex(targetBusinessDef);
        if (managerIdx >= 0 && managerIdx < this._managerList.length) {
            return this._unlockedFlags[managerIdx];
        }

        return false;
    }

    canAfford(targetBusinessDef) {
        let managerIdx = this._findManagerIndex(targetBusinessDef);
        if (managerIdx >= 0 && managerIdx < this._managerList.length) {
            return this._moneyController.canAfford(this._managerList[managerIdx].price);
        }

        return false;
    }

    _findManagerIndex(targetBusinessDef) {
        for (let i = 0; i < this._managerList.length; i++) {
            if (this._managerList[i].targetBusinessDef === targetBusinessDef) {
                return i;
            }
        }

        return -1;
    }

    

    writeLocal(localStorage) {
        localStorage.setItem("managerData", JSON.stringify(this._unlockedFlags));
    }

    readLocal(localStorage) {
        let loadedFlags = JSON.parse(localStorage.getItem("managerData"));
        if (loadedFlags) {
            let indexCap = Math.min(this._unlockedFlags.length, loadedFlags.length);
            for (let i = 0; i < indexCap; i++) {
                this._unlockedFlags[i] = loadedFlags[i];
            }
        }
    }

    

    resetAll() {
        for (let i = 0; i < this._unlockedFlags.length; i++) {
            this._unlockedFlags[i] = false;
        }
    }
}



class TimerController
{
    _timerId = 0;
    _timerList = [];

        startTimer(duration, completionHandler, startTime) {
        let id = this._timerId;
        this._timerId++;

        let newTimer = new Timer(id, duration, completionHandler);
        if (startTime) {
            newTimer.time = startTime;
        }

        this._timerList.push(newTimer);

        return id;
    }
    
    updateTimers(dt) {
        for (let timer of this._timerList) {
            timer.time += dt;
        }

        let ptr = 0;
        while (ptr < this._timerList.length) {
            let timer = this._timerList[ptr];
            if (timer.time < timer.duration) {
                ptr++;
            } else {
                this._timerList.splice(ptr, 1);

                let repeatCount = Math.floor(timer.time / timer.duration);
                let remainingTime = timer.time - repeatCount * timer.duration;
                timer.completionHandler(timer.id, repeatCount, remainingTime);
            }
        }
    }

    getRemainingTime(timerId) {
        for (let timer of this._timerList) {
            if (timer.id === timerId) {
                return timer.duration - timer.time;
            }
        }

        return -1;
    }

    abortTimer(timerId) {
        let ptr = 0;
        while (ptr < this._timerList.length) {
            let timer = this._timerList[ptr];
            if (timer.id === timerId) {
                this._timerList.splice(ptr, 1);
                break;
            }
        }
    }

    

    resetAll()
    {
        this._timerId = 0;
        this._timerList = [];
    }
}



class MoneyController
{
    _amount = 0;

    get amount() {
        return this._amount;
    }

    canAfford(cost) {
        return this._amount >= cost;
    }

    grant(amount) {
        this._amount += amount;
    }

    consume(amount) {
        if (amount <= this._amount) {
            this._amount -= amount;

            return true;
        }

        return false;
    }

    

    render(ctx, x, y) {
        ctx.font = "24px Arial";
        ctx.fillStyle = TextColorBlack;
        ctx.textAlign = "start";

        let moneyString = "You have " + TextFormatter.formatWholeMoneyString(this._amount) + '$';
        ctx.fillText(moneyString, x, y + 36);
    }

    

    writeLocal(localStorage) {
        localStorage.setItem("moneyAmount", this._amount.toString());
    }

    readLocal(localStorage) {
        this._amount = parseInt(localStorage.getItem("moneyAmount"));
    }

    

    resetAll()
    {
        this._amount = 0;
    }
}