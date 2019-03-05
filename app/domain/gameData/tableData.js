function TableData(data) {
    this.mapData = {};
    this.arrData = [];
    this.KEY = 0;
    this.data = data;
    this.length = 0;   // map的有效数据长度
    /**
     * find items by attribute
     *
     * @param {String} attribute name
     * @param {String|Number} the value of the attribute
     * @return {Array} result
     * @api public
     */
    this.findBy = function (attr, value) {
        var result = [];
        var i, item;
        for (i in this.data) {
            item = this.data[i];
            if (item[attr] == value) {
                result.push(item);
            }
        }
        return result;
    }

    // 返回满足多个条件的一条数据
    this.findByEx = function () {
        var argcheck = arguments.length % 2;
        if (argcheck != 0)
            return null;
        var i, item;
        for (i in this.data) {
            item = this.data[i];
            var bfind = true;
            for (var jj = 0; jj < arguments.length;) {
                var tempattr = arguments[jj];
                jj++;
                var tempvalue = arguments[jj];
                jj++;
                if (item[tempattr] != tempvalue) {
                    bfind = false;
                    break;
                }
            }
            if (bfind)
                return item;
        }
        return null;
    };

    // 返回满足条件的第一个
    this.findByOne = function (attr, value) {
        var i, item;
        for (i in this.data) {
            item = this.data[i];
            if (item[attr] == value) {
                return item;
            }
        }
        return null;
    };


    // 寻找满足两个key区间的数据( )
    this.findByRange = function (attr1, attr2, value) {
        var result = [];
        var i, item, tempmin, tempmax, tempvalue;
        for (i in this.data) {
            item = this.data[i];
            tempmin = item[attr1];
            tempmax = item[attr2];
            if (tempmax < tempmin) {
                tempvalue = tempmin;
                tempmin = tempmax;
                tempmax = tempvalue;
            }
            if (value >= tempmin && value < tempmax) {
                result.push(item);
            }
        }
        return result;
    }

    this.findByKey = function (value) {
        var i, item;
        for (i in data) {
            item = data[i];
            if (item[this.KEY] == value) {
                return item;
            }
        }
        return item;
    }

    this.findBy2Key = function (attr1, key1, attr2, key2) {
        var i, item;
        for (i in this.data) {
            item = this.data[i];
            if (item[attr1] == key1 && item[attr2] == key2) {
                return item;
            }
        }
        return null;
    }

    this.DataToMap = function () {
        for (var i in data) {
            var key = data[i][this.KEY];
            if (typeof( key ) != "number")
                continue;
            this.mapData[key] = data[i];
            this.length++;
        }
    }

    this.addRandData = function (key) {
        console.log(data);
        for (var i = 1; i < data.length; i++) {
            var keyD = data[i][key];
            console.log('keyD', keyD, typeof( keyD ));
            if (typeof( keyD ) != "number")
                break;
            this.arrData.push(keyD);
            this.mapData[keyD] = [data[i][key], data[i][key + 1]];
            this.length++;
        }
    }


    this.DataToMapByKey = function (key) {
        for (var i in data) {
            var keyD = data[i][key];
            if (typeof( keyD ) != "number")
                continue;
            this.mapData[keyD] = data[i];
            this.length++;
        }
    }
    this.find = function (attr, position, value1, value2) {
        var result = [];
        var i, item;
        for (i in this.data) {
            item = this.data[i];
            var eq = item[attr] + ''.charAt(position) == value1;
            if ((item[attr] + '').charAt(position) == value1 || (item[attr] + '').charAt(position) == value2) {
                result.push(item);
            }
        }
        return result;
    }
    this.GetDataOfKey = function (value) {
        return this.mapData[value];
    }

    this.SetData = function (data) {
        this.data = data;
    }

    this.GetMap = function () {
        return this.mapData;
    }
    this.GetMapLength = function () {
        return this.length;
    }

    this.GetArrData = function () {
        return this.arrData;
    }
}

module.exports = TableData;


