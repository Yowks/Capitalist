
// definitions for data types of the game

class Offer
{
    constructor(name, price, revenue, processingTime, defaultLevel = 0) {
        this.name = name;
        this.price = price;
        this.revenue = revenue;
        this.processingTime = processingTime;
        this.defaultLevel = defaultLevel;
    }
}

const Offers = [
    new Offer("Earth", 4, 5, 1, 1),
    new Offer("Moon", 200, 100, 2),
    new Offer("Mars", 10000, 5000, 6),
    new Offer("System", 20000, 30000, 15),
    new Offer("Galaxy", 400000, 110000, 30),
    new Offer("Universe", 20000000, 5000000, 60),
];



class RuntimeBusiness
{
    constructor(definition, level) {
        this.definition = definition;
        this.level = level;

        this.name = definition.name;
        this.price = definition.price;
        this.revenue = definition.revenue;
        this.processingTime = definition.processingTime;

        this.timerId = -1;
        this.hasManager = false;
    }
}



class Manager
{
    constructor(name, price, targetBusinessDef) {
        this.name = name;
        this.price = price;
        this.targetBusinessDef = targetBusinessDef;
    }
}

const Managers = [
    new Manager("Jeff Bezos", 100, Offers[0]),
    new Manager("Ellon Musk", 500, Offers[1]),
    new Manager("Orianna", 1000, Offers[2]),
    new Manager("Shaco", 10000, Offers[3]),
    new Manager("Ekko", 1000000, Offers[4]),
    new Manager("Alexandre ;)", 5000000000, Offers[5]),
];



class Timer
{
    constructor(id, duration, completionHandler) {
        this.id = id;
        this.time = 0;
        this.duration = duration;
        this.completionHandler = completionHandler;
    }
}



class Rect {
    constructor(x, y, width, height, strokeColor, fillColor = "#0095DD") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.fillColor = fillColor;

        if (strokeColor) {
            this.hasStroke = true;
            this.strokeColor = strokeColor;
        } else {
            this.hasStroke = false;
        }
    }

    render(ctx, overrideFillColor) {
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = overrideFillColor ? overrideFillColor : this.fillColor;
        ctx.fill();

        if (this.hasStroke) {
            ctx.strokeStyle = this.strokeColor;
            ctx.stroke();
        }

        ctx.closePath();
    }

    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
            y >= this.y && y <= this.y + this.height;
    }
}

/*****************************/

const BusinessUIItemWidth = 600;
const BusinessUIItemHeight = 80;

const RevenueRectOffsetX = 100;
const RevenueRectWidth = 500;
const RevenueRectHeight = 40;

const UpgradeRectOffsetX = 100;
const UpgradeRectOffsetY = 40;
const UpgradeRectWidth = 250;
const UpgradeRectHeight = 40;

const TimerRectOffsetX = 350;
const TimerRectOffsetY = 40;
const TimerRectWidth = 250;
const TimerRectHeight= 40;

const ManagerRectGapX = 0;
const ManagerRectWidth = 200;
const ManagerRectHeight = 80;

/*****************************/

const BackgroundColor = "#736961";
const BorderColor = "#3A3630";
const TimerRectColor = "#FFF";
const ItemColorRed = "rgb(34, 92, 37)";
const BlockedBackground = "grey";
const ProgressBarColor = "#84AF4D";
const BarBackgroundColor = "#3B3630";
const IconBackgroundColor = "#8DB8CE";
const TextColorBlack = "#0A0908";
const TextColorWhite = "#F9F8F7";

/*****************************/

class BusinessUIItem
{
    constructor(x, y, business, manager, startProcess, tryUpgrade, tryUnlockManager) {
        this.business = business;
        this.manager = manager;
        this.startProcess = startProcess;
        this.tryUpgrade = tryUpgrade;
        this.tryUnlockManager = tryUnlockManager;

        this.x = x;
        this.y = y;

        this.frame = new Rect(x, y, BusinessUIItemWidth, BusinessUIItemHeight, 
                BorderColor, BackgroundColor);
        this.revenueRect = new Rect(x + RevenueRectOffsetX, y, 
                RevenueRectWidth, RevenueRectHeight, 
                BorderColor, BackgroundColor);
        this.upgradeRect = new Rect(x + UpgradeRectOffsetX, y + UpgradeRectOffsetY, 
                UpgradeRectWidth, UpgradeRectHeight, 
                BorderColor, ItemColorRed);
        this.timerRect = new Rect(x + TimerRectOffsetX, y + TimerRectOffsetY,
                TimerRectWidth, TimerRectHeight,
                BorderColor, TimerRectColor);

        this.managerRect = new Rect(x + BusinessUIItemWidth + ManagerRectGapX, y,
                ManagerRectWidth, ManagerRectHeight, 
                BorderColor, BackgroundColor);
    }

    

    render(ctx, timerController) {
        if (this.business.level > 0) {
            this._renderUnlockedItem(ctx, timerController);
        } else {
            this._renderLockedItem(ctx);
        }
    }

    _renderUnlockedItem(ctx, timerController) {
        this.frame.render(ctx);
        this.revenueRect.render(ctx);
        this.upgradeRect.render(ctx);
        this.timerRect.render(ctx);

        if (this.manager) {
            if (this.business.hasManager) {
                this._renderUnlockedManager(ctx);
            } else {
                this._renderLockedManager(ctx);
            }
        }

        let remainingTime = timerController.getRemainingTime(this.business.timerId);
        let timerString = remainingTime != -1 ? TextFormatter.formatTimeString(remainingTime) : "00:00:00";

        ctx.font = "16px Arial";
        ctx.fillStyle = TextColorBlack;
        ctx.textAlign = "center";
        ctx.fillText(timerString, 
                this.timerRect.x + TimerRectWidth / 2, this.timerRect.y + 24);

        if (remainingTime != -1) {
            let percent = 1 - remainingTime / this.business.processingTime;
            percent = Math.max(0, Math.min(percent, 1));

            new Rect(this.revenueRect.x, this.revenueRect.y, 
                    RevenueRectWidth * percent, RevenueRectHeight,
                    BorderColor, ProgressBarColor).render(ctx);
        }

        ctx.fillStyle = TextColorBlack;
        ctx.fillText(TextFormatter.formatWholeMoneyString(this.business.revenue), 
                this.revenueRect.x + RevenueRectWidth / 2, this.revenueRect.y + 24);

        ctx.fillText(this.business.level.toString(),
                this.frame.x + UpgradeRectOffsetX / 2, this.upgradeRect.y + 24);

        ctx.fillStyle = TextColorWhite;
        ctx.fillText(TextFormatter.formatWholeMoneyString(this.business.price),
                this.upgradeRect.x + UpgradeRectWidth / 2, this.upgradeRect.y + 24);
    }

    _renderLockedItem(ctx) {
        this.frame.render(ctx, BlockedBackground);

        ctx.font = "20px Arial";
        ctx.fillStyle = TextColorBlack;
        ctx.textAlign = "center";
        ctx.fillText(this.business.name,
                this.frame.x + BusinessUIItemWidth / 2, this.frame.y + 28);

        ctx.fillStyle = TextColorWhite;
        ctx.fillText(TextFormatter.formatWholeMoneyString(this.business.price),
                this.frame.x + BusinessUIItemWidth / 2, this.frame.y + BusinessUIItemHeight / 2 + 28);
    }

    _renderUnlockedManager(ctx) {
        this.managerRect.render(ctx);

        ctx.font = "24px Arial";
        ctx.fillStyle = TextColorBlack;
        ctx.textAlign = "center";
        ctx.fillText(this.manager.name,
                this.managerRect.x + ManagerRectWidth / 2, 
                this.managerRect.y + ManagerRectHeight / 2 + 12);
    }

    _renderLockedManager(ctx) {
        this.managerRect.render(ctx, BlockedBackground);

        ctx.font = "20px Arial";
        ctx.fillStyle = TextColorBlack;
        ctx.textAlign = "center";
        ctx.fillText('Hire '+this.manager.name,
                this.managerRect.x + ManagerRectWidth / 2, this.managerRect.y + 28);

        ctx.fillStyle = TextColorWhite;
        ctx.fillText(TextFormatter.formatWholeMoneyString(this.manager.price),
                this.managerRect.x + ManagerRectWidth / 2, 
                this.managerRect.y + ManagerRectHeight / 2 + 28);
    }

    

    checkClicking(x, y) {
        let inside = this.frame.containsPoint(x, y);
        if (inside) {
            if (this.business.level == 0 ||
                    this.upgradeRect.containsPoint(x, y)) {
                if (this.tryUpgrade) {
                    this.tryUpgrade();
                }
            } else {
                if (this.startProcess) {
                    this.startProcess();
                }
            }
        } else if (!this.business.hasManager &&
                this.managerRect.containsPoint(x, y)) {
            if (this.tryUnlockManager) {
                this.tryUnlockManager();
            }
        }
    }
}
