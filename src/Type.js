const TypeEnvironment = require("./TypeEnvironment");

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
        if (other instanceof Type.Alias) {
            return other.equals(this);
        }
        if (other instanceof Type.Union){
            return other.equals(this);
        }
        return this.name === other.name;
    }
    static fromString(typeStr) {
        if (this.hasOwnProperty(typeStr)) {
            return this[typeStr];
        }
        if (typeStr.includes('Fn<')) {
            return Type.Function.fromString(typeStr);
        }
        throw `Unknown type: ${typeStr}`;
    }
}

Type.number = new Type('number');
Type.string = new Type('string');
Type.boolean = new Type('boolean');
Type.null = new Type('null');
Type.any = new Type('any');
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
    static fromString(typeStr) {
        if (Type.hasOwnProperty(typeStr)) {
            return Type[typeStr];
        }
        let matched = /^Fn<(\w+)<([a-z,\s]+)>>$/.exec(typeStr);
        if (matched != null) {
            const [_, returnTypeStr, paramsString] = matched;

            const paramTypes = paramsString.split(/,\s*/g).map(param => Type.fromString(param));
            return (Type[typeStr] = new Type.Function({
                name: typeStr,
                paramTypes,
                returnType: Type.fromString(returnTypeStr),
            }));
        }
        matched = /^Fn<(\w+)>$/.exec(typeStr);
        if (matched != null) {
            const [_, returnTypeStr] = matched;
            return (Type[typeStr] = new Type.Function({
                name: typeStr,
                paramTypes: [],
                returnType: Type.fromString(returnTypeStr),
            }));
        }
        throw `Type.Function.fromString: Unknown type: ${typeStr}.`;
    }
};
Type.Alias = class extends Type {
    constructor({ name, parent }) {
        super(name);
        this.parent = parent;
    }

    equals(other) {
        // console.log('check type alias');
        if (this.name === other.name) {
            return true;
        }
        return this.parent.equals(other);
    }
};
Type.Class = class extends Type {
    constructor({ name, superClass = Type.null }) {
        super(name);
        this.superClass = superClass;
        this.env = new TypeEnvironment({}, superClass != Type.null ? superClass.env : null);
    }

    getField(name) {
        return this.env.lookup(name);
    }
    equals(other) {
        if (this === other) {
            return true;
        }
        if (other instanceof Type.Alias) {
            return other.equals(this);
        }
        if (this.superClass != Type.null) {
            return this.superClass.equals(other);
        }
        return false;
    }
};

Type.Union = class extends Type{
    constructor({name,optionTypes}){
        super(name);
        // console.log('new union',name,optionTypes);
        this.optionTypes =optionTypes;
    }
    includesAll(types){
        if(types.length !== this.optionTypes.length){
            return false;
        }
        for (const type_ of types){
            if(!this.equals(type_)){
                return false;
            }
        }
        return true;
    }
    equals(other){
        if(this === other){
            return true;
        }
        if (other instanceof Type.Alias) {
            return other.equals(this);
        }
        if(other instanceof Type.Union){
            return this.includesAll(other.optionTypes);
        }
        return this.optionTypes.some(t=>t.equals(other));
    }
};
Type.GenericFunction = class extends Type{
    constructor({name=null,genericTypesStr,params,returnType,body,env}){
        super(`${name || 'lambda'} <${genericTypesStr}>`);
        this.genericTypes = genericTypesStr.split(',');
        this.params=params;
        this.returnType = returnType;
        this.body = body;
        this.env= env;
    }
}


module.exports = Type;