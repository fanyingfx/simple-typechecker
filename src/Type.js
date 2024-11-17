class Type {
    constructor(name) {
        this.name = name;
    }
    getName() {
        return this.name;
    }
    toString() {
        return this.getName();
    }

    equals(other) {
        return this.name === other.name;
    }
    static fromString(typeStr) {
        if (this.hasOwnProperty(typeStr)) {
            return this[typeStr];
        }
        if(typeStr.includes('Fn<')){
            return Type.Function.fromString(typeStr);
        }
        throw `Unknown type: ${typeStr}`;
    }
}

Type.number = new Type('number');
Type.string = new Type('string');
Type.boolean = new Type('boolean');
Type.Function = class extends Type {
    constructor({ name = null, paramTypes, returnType }) {
        super(name);
        this.paramTypes = paramTypes;
        this.returnType = returnType;
        this.name = this.getName();

    }
    getName() {
        if (this.name == null) {
            const name = ['Fn<', this.returnType.getName()];
            if (this.paramTypes.length !== 0) {
                const params = [];
                for (let i = 0; i < this.paramTypes.length; i++) {
                    params.push(this.paramTypes[i].getName());
                }
                name.push('<', params.join(','), '>');
            }
            name.push('>');
        }
        return this.name;

    }
    equals(other) {
        if (this.paramTypes.length !== other.paramTypes.length) {
            return false;
        }
        for (let i = 0; i < this.paramTypes.length; i++) {
            if (!this.paramTypes[i].equals(other.paramTypes[i])) {
                return false;
            }
        }
        if (!this.returnType.equals(other.returnType)) {
            return false;
        }
        return true;
    }
    static fromString(typeStr){
        if(Type.hasOwnProperty(typeStr)){
            return Type[typeStr];
        }
        let matched = /^Fn<(\w+)<([a-z,\s]+)>>$/.exec(typeStr);
        if(matched != null){
            const [_,returnTypeStr,paramsString] = matched;

            const paramTypes = paramsString.split(/,\s*/g).map(param=>Type.fromString(param));
            return (Type[typeStr] = new Type.Function({
                name: typeStr,
                paramTypes,
                returnType: Type.fromString(returnTypeStr),
            }));
        }
        matched = /^Fn<(\w+)>$/.exec(typeStr);
        if(matched!=null){
            const [_,returnTypeStr] = matched;
            return (Type[typeStr] = new Type.Function({
                name: typeStr,
                paramTypes: [],
                returnType: Type.fromString(returnTypeStr),
            }));
        }
        throw `Type.Function.fromString: Unknown type: ${typeStr}.`;
    }
};
module.exports = Type;