import {vec3} from "glMatrix"

export const DETAIL_LEVEL =
{
    BASIC:0,
    PARTIAL:1,
    FULL:2
};

export var color_detail =
{
    created()
    {
        this.DETAIL_LEVEL = DETAIL_LEVEL;
    },
    props:
    [
        "detail",
        "color"
    ],
    methods:
    {
        calc_delta(from,to,linear)
        {
            from = vec3.clone(linear ? from.XYZ : from.Lab);
            to = vec3.clone(linear ? to.XYZ : to.Lab);
            let delta = vec3.create();
            vec3.sub(delta,to,from);
            return delta;
        }
    },
    computed:
    {
        target()
        {
            return this.$store.state.target_color;
        },
        current()
        {
            return this.$store.state.current_color;
        },
        use_linear()
        {
            return this.$store.state.use_linear;
        },
        coords()
        {
            return this.use_linear ? this.color.XYZ : this.color.Lab;
        },
        target_delta()
        {
            return this.calc_delta(this.target,this.color,this.use_linear);
        },
        target_delta_unit()
        {
            let unit = vec3.clone(this.target_delta);
            vec3.normalize(unit,unit);
            return unit;
        },
        current_delta()
        {
            return this.calc_delta(this.current,this.color,this.use_linear);
        },
        current_delta_unit()
        {
            let unit = vec3.clone(this.current_delta);
            vec3.normalize(unit,unit);
            return unit;
        },
        theta()
        {
            let color = vec3.clone(this.use_linear ? this.color.XYZ : this.color.Lab);
            let target = vec3.clone(this.use_linear ? this.target.XYZ : this.target.Lab);
            let current = vec3.clone(this.use_linear ? this.current.XYZ : this.current.Lab);
            vec3.sub(color,color,target);
            vec3.sub(current,current,target);
            let theta = vec3.angle(color,current);
            theta /= Math.PI;
            theta = (theta*2)-1;
            return theta;
        }
    },
    template:/*html*/`
        <div>
            <table class="swatch-info"><tbody>
                <tr>
                    <td>Name:</td>
                    <td colspan="3">{{color.name}}</td>
                </tr>
                <tr>
                    <td>{{use_linear ? "XYZ" : "Lab"}}</td>
                    <td>{{coords[0].toFixed(2)}}</td>
                    <td>{{coords[1].toFixed(2)}}</td>
                    <td>{{coords[2].toFixed(2)}}</td>
                </tr>
                <tr v-if="detail > DETAIL_LEVEL.BASIC">
                    <td>Target &Delta;:</td>
                    <td>{{target_delta[0].toFixed(2)}}</td>
                    <td>{{target_delta[1].toFixed(2)}}</td>
                    <td>{{target_delta[2].toFixed(2)}}</td>
                </tr>
                <tr v-if="detail > DETAIL_LEVEL.BASIC">
                    <td>Unit Target &Delta;:</td>
                    <td>{{target_delta_unit[0].toFixed(2)}}</td>
                    <td>{{target_delta_unit[1].toFixed(2)}}</td>
                    <td>{{target_delta_unit[2].toFixed(2)}}</td>
                </tr>
                <tr v-if="detail > DETAIL_LEVEL.PARTIAL">
                    <td>Current &Delta;:</td>
                    <td>{{current_delta[0].toFixed(2)}}</td>
                    <td>{{current_delta[1].toFixed(2)}}</td>
                    <td>{{current_delta[2].toFixed(2)}}</td>
                </tr>
                <tr v-if="detail > DETAIL_LEVEL.PARTIAL">
                    <td>Unit Current &Delta;:</td>
                    <td>{{current_delta_unit[0].toFixed(2)}}</td>
                    <td>{{current_delta_unit[1].toFixed(2)}}</td>
                    <td>{{current_delta_unit[2].toFixed(2)}}</td>
                </tr>
                <tr v-if="detail > DETAIL_LEVEL.PARTIAL">
                    <td>&Theta;:</td>
                    <td colspan="3">{{theta.toFixed(4)}}</td>
                </tr>
            </tbody></table>
        </div>`
};
