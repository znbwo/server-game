var utils = module.exports;

// control variable of func "myPrint"
var isPrintFlag = false;
// var isPrintFlag = true;

/**
 * Check and invoke callback function
 */
utils.invokeCallback = function (cb) {
    if (!!cb && typeof cb === 'function') {
        cb.apply(null, Array.prototype.slice.call(arguments, 1));
    }
};

/**
 * clone an object
 */
utils.clone = function (origin) {
    if (!origin) {
        return;
    }

    var obj = {};
    for (var f in origin) {
        if (origin.hasOwnProperty(f)) {
            obj[f] = origin[f];
        }
    }
    return obj;
};

utils.size = function (obj) {
    if (!obj) {
        return 0;
    }
    var size = 0;
    for (var f in obj) {
        if (obj.hasOwnProperty(f)) {
            size++;
        }
    }
    return size;
};

utils.isArray = function (object) {
    return object && typeof object === 'object' && Array == object.constructor;
};

utils.isEmptyObject = function (e) {
    var t;
    for (t in e)
        return !1;
    return !0
};

utils.getCurrTime = function () {
    return (Date.parse(new Date()) / 1000);
}

utils.getMicTime = function () {
    return new Date().getTime();
}
utils.getRandNum = function (maxNum) {
    return Math.floor(Math.random() * maxNum);
}
//包含首尾的范围随机
utils.randomNumBetweenWithBorder = function (Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    var num = Min + Math.round(Rand * Range); //四舍五入
    return num;
};

//从一个给定的数组arr中,随机返回num个不重复项
utils.getArrayRandomItems = function (arr, num) {
    //取出的数值项,保存在此数组
    var return_array = [];
    for (var i = 0; i < num; i++) {
        //判断如果数组还有可以取出的元素,以防下标越界
        if (arr.length > 0) {
            //在数组中产生一个随机索引
            var arrIndex = Math.floor(Math.random() * arr.length);
            //将此随机索引的对应的数组元素值复制出来
            return_array[i] = arr[arrIndex];
            //然后删掉此索引的数组元素,这时候temp_array变为新的数组
            arr.splice(arrIndex, 1);
        } else {
            //数组中数据项取完后,退出循环,比如数组本来只有10项,但要求取出20项.
            break;
        }
    }
    return return_array;
}
// print the file name and the line number ~ end
//console.log('\n' + aimStr);
utils.contains = function (arr, obj) {
    var i = arr.length;
    while (i--) {
        if (arr[i] === obj) {
            return true;
        }
    }
    return false;
};

// print the file name and the line number ~ begin
function getStack() {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) {
        return stack;
    };
    var err = new Error();
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
}

function getFileName(stack) {
    return stack[1].getFileName();
}

function getLineNumber(stack) {
    return stack[1].getLineNumber();
}

utils.myPrint = function () {
    if (isPrintFlag) {
        var len = arguments.length;
        if (len <= 0) {
            return;
        }
        var stack = getStack();
        var aimStr = '\'' + getFileName(stack) + '\' @' + getLineNumber(stack) + ' :\n';
        for (var i = 0; i < len; ++i) {
            aimStr += arguments[i] + ' ';
        }
        console.log('\n' + aimStr);
    }
};
// print the file name and the line number ~ end

//
utils.contains = function (arr, obj) {
    var i = arr.length;
    while (i--) {
        if (arr[i] === obj) {
            return true;
        }
    }
    return false;
}
//返回数组索引
utils.getArrayIndex = function (arr, val) {
    if (!this.isArray(arr)) {
        return arr.indexOf(val);
    } else {
        return -1;
    }
}

//时间戳改成时间格式2014-12-12 下午01：10
utils.js_date_time = function (unixtime) {
    var timestr = new Date(parseInt(unixtime) * 1000);
    var datetime = timestr.toLocaleString().replace(/年|月/g, "-").replace(/日/g, " ");
    return datetime;
}

//时间戳转换成八位日期2014-5-5
utils.getDateYY_MM_dd = function (uData) {
    var myDate = new Date(uData * 1000);
    var year = myDate.getFullYear();
    var month = myDate.getMonth() + 1;
    var day = myDate.getDate();
    return year + '-' + month + '-' + day;
}

utils.getEnScore = function (score) {
    var curTime = this.getCurrTime();
    var maxTime = 9999999999;
    var difTime = maxTime - curTime;
    var sumScore = score * Math.pow(10, 10) + difTime;
    return sumScore;
}

utils.getDeScore = function (score) {
    var newScore = parseInt(score / Math.pow(10, 10));
    return newScore;
}
utils.isToday = function (time) {
    return (new Date().toDateString() === new Date(time * 1000).toDateString());
};
utils.isTime = function (time) {
    if (time <= 0) {
        return false;
    } else {
        return true;
    }
};
utils.gapOfNow = function (time) {
    return Math.abs(this.getCurrTime() - time);
};
utils.UUID = function () {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = "-";
    var uuid = s.join("");
    return uuid;
}
utils.getConstantValue = function (constantTableData, index, logger) {
    var constantData = constantTableData[index];
    if (!constantData || !constantData.getValue_Constant()) {
        logger.info('常量表数据索引 %d getValue_Constant不存在！');
    }
    return constantData.getValue_Constant();
};
utils.getConstantValueE = function (constantTableData, index, logger) {
    var constantData = constantTableData[index];
    if (!constantData || !constantData.getValueE_Constant()) {
        logger.info('常量表数据索引 %d getValueE_Constant不存在！');
    }
    return constantData.getValueE_Constant();
};