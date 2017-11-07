import { DroiConstant } from './droi-const';

class DroiCondition {


    // or( arg: DroiCondition): DroiCondition {
    //     return this.add( DroiConstant.DroiQuery_OR, arg );
    // }

    or = ( arg: DroiCondition): DroiCondition => this.add( DroiConstant.DroiQuery_OR, arg );
    and = ( arg: DroiCondition): DroiCondition => this.add( DroiConstant.DroiQuery_AND, arg );
    static cond = ( arg1: string, type: string, arg2: any ): DroiCondition => { 
        let args: Array<any> = (arg2===undefined||arg2==null)?[arg1, type]:[arg1, type, arg2]; 
        let newInstance = new DroiCondition();
        newInstance.conditions.push( args );
        return newInstance;
    };
    static selectIn = ( arg1: string, items: Array<any> ): DroiCondition => { 
        let args = [arg1, DroiConstant.DroiCondition_IN, items ];
        let newInstance = new DroiCondition();
        newInstance.conditions.push( args );
        return newInstance;
    };

    static notSelectIn = ( arg1: string, items: Array<any> ): DroiCondition => { 
        let args = [arg1, DroiConstant.DroiCondition_NOTIN, items ];
        let newInstance = new DroiCondition();
        newInstance.conditions.push( args );
        return newInstance;
    };
    
    //
    static lt = ( arg1: string, arg2: any): DroiCondition => DroiCondition.cond( arg1, DroiConstant.DroiCondition_LT, arg2 );
    static ltOrEq = ( arg1: string, arg2: any): DroiCondition => DroiCondition.cond( arg1, DroiConstant.DroiCondition_LT_OR_EQ, arg2 );
    static eq = ( arg1: string, arg2: any): DroiCondition => DroiCondition.cond( arg1, DroiConstant.DroiCondition_EQ, arg2 );
    static neq = ( arg1: string, arg2: any): DroiCondition => DroiCondition.cond( arg1, DroiConstant.DroiCondition_NEQ, arg2 );
    static gtOrEq = ( arg1: string, arg2: any): DroiCondition => DroiCondition.cond( arg1, DroiConstant.DroiCondition_GT_OR_EQ, arg2 );
    static gt = ( arg1: string, arg2: any): DroiCondition => DroiCondition.cond( arg1, DroiConstant.DroiCondition_GT, arg2 );
    static isNull = ( arg1: string): DroiCondition => DroiCondition.cond( arg1, DroiConstant.DroiCondition_ISNULL, null );
    static isNotNull = ( arg1: string): DroiCondition => DroiCondition.cond( arg1, DroiConstant.DroiCondition_ISNOTNULL, null );
    static contains = ( arg1: string, arg2: any): DroiCondition => DroiCondition.cond( arg1, DroiConstant.DroiCondition_CONTAINS, arg2 );
    static notContains = ( arg1: string, arg2: any): DroiCondition => DroiCondition.cond( arg1, DroiConstant.DroiCondition_NOTCONTAINS, arg2 );
    static startsWith = ( arg1: string, arg2: string): DroiCondition => DroiCondition.cond( arg1, DroiConstant.DroiCondition_STARTSWITH, arg2 );
    static notStartsWith = ( arg1: string, arg2: string): DroiCondition => DroiCondition.cond( arg1, DroiConstant.DroiCondition_NOTSTARTSWITH, arg2 );
    static endsWith = ( arg1: string, arg2: string): DroiCondition => DroiCondition.cond( arg1, DroiConstant.DroiCondition_ENDSWITH, arg2 );
    static notEndsWith = ( arg1: string, arg2: string): DroiCondition => DroiCondition.cond( arg1, DroiConstant.DroiCondition_NOTENDSWITH, arg2 );
    
    private add( type: string, arg: DroiCondition ): DroiCondition {
        let res = new DroiCondition();
        res.type = type;

        if ( this.type == type ) {
            this.conditions.forEach( (item) => res.conditions.push(item) );
        } else {
            res.conditions.push( this );
        }

        if ( arg.type == type ) {
            arg.conditions.forEach( (item) => res.conditions.push(item) );
        } else {
            res.conditions.push( arg );
        }
        return res;
    }

    private constructor() {
        this.conditions = [];
        this.type = DroiConstant.DroiQuery_COND;
    }

    type: string;
    conditions: Array<any>;
}


export { DroiCondition }