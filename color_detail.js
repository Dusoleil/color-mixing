import {vec3} from "glMatrix"

export const DETAIL_LEVEL =
{
    BASIC:0,
    PARTIAL:1,
    NO_THETA:2,
    FULL:3
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
        },
        normalize_delta(delta)
        {
            let unit = vec3.clone(delta);
            vec3.normalize(unit,unit);
            return unit;
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
        target_delta_lab()
        {
            return this.calc_delta(this.target,this.color,false);
        },
        target_delta_xyz()
        {
            return this.calc_delta(this.target,this.color,true);
        },
        current_delta_lab()
        {
            return this.calc_delta(this.current,this.color,false);
        },
        current_delta_xyz()
        {
            return this.calc_delta(this.current,this.color,true);
        },
        target_delta_lab_unit()
        {
            return this.normalize_delta(this.target_delta_lab);
        },
        target_delta_xyz_unit()
        {
            return this.normalize_delta(this.target_delta_xyz);
        },
        current_delta_lab_unit()
        {
            return this.normalize_delta(this.current_delta_lab);
        },
        current_delta_xyz_unit()
        {
            return this.normalize_delta(this.current_delta_xyz);
        },
        target_delta_e()
        {
            return vec3.distance(this.color.Lab,this.target.Lab);
        },
        current_delta_e()
        {
            return vec3.distance(this.color.Lab,this.current.Lab);
        },
        target_distance()
        {
            return vec3.distance(this.color.XYZ,this.target.XYZ);
        },
        current_distance()
        {
            return vec3.distance(this.color.XYZ,this.current.XYZ);
        },
        theta()
        {
            let color = vec3.clone(this.color.XYZ);
            let target = vec3.clone(this.target.XYZ);
            let current = vec3.clone(this.current.XYZ);
            vec3.sub(color,color,target);
            vec3.sub(current,current,target);
            let theta = vec3.angle(color,current);
            theta /= Math.PI;
            theta = (theta*2)-1;
            return theta;
        }
    },
    template:/*html*/`
        <v-expansion-panels>
            <v-expansion-panel title="Coordinates"><v-expansion-panel-text>
            <v-table><tbody>
                <tr>
                    <td>Lab:</td>
                    <td>{{color.L.toFixed(2)}}</td>
                    <td>{{color.a.toFixed(2)}}</td>
                    <td>{{color.b.toFixed(2)}}</td>
                </tr>
                <tr>
                    <td>XYZ:</td>
                    <td>{{color.X.toFixed(2)}}</td>
                    <td>{{color.Y.toFixed(2)}}</td>
                    <td>{{color.Z.toFixed(2)}}</td>
                </tr>
                <tr>
                    <td>RGB:</td>
                    <td>{{color.R.toFixed(2)}}</td>
                    <td>{{color.G.toFixed(2)}}</td>
                    <td>{{color.B.toFixed(2)}}</td>
                </tr>
                <tr>
                    <td>HEX:</td>
                    <td colspan="3">{{color.hex}}</td>
                </tr>
            </tbody></v-table>
            </v-expansion-panel-text></v-expansion-panel>
            <template v-if="detail > DETAIL_LEVEL.BASIC && target">
            <v-expansion-panel title="&Delta; from Target"><v-expansion-panel-text>
            <v-table><tbody>
                <tr>
                    <td>Lab:</td>
                    <td>{{target_delta_lab[0].toFixed(2)}}</td>
                    <td>{{target_delta_lab[1].toFixed(2)}}</td>
                    <td>{{target_delta_lab[2].toFixed(2)}}</td>
                </tr>
                <tr>
                    <td>&Delta;E</td>
                    <td colspan="3">{{target_delta_e.toFixed(4)}}</td>
                </tr>
                <tr>
                    <td>XYZ:</td>
                    <td>{{target_delta_xyz[0].toFixed(2)}}</td>
                    <td>{{target_delta_xyz[1].toFixed(2)}}</td>
                    <td>{{target_delta_xyz[2].toFixed(2)}}</td>
                </tr>
                <tr>
                    <td>|&Delta;|</td>
                    <td colspan="3">{{target_distance.toFixed(4)}}</td>
                </tr>
            </tbody></v-table>
            </v-expansion-panel-text></v-expansion-panel>
            <v-expansion-panel title="Normalized &Delta; from Target"><v-expansion-panel-text>
            <v-table><tbody>
                <tr>
                    <td>Lab:</td>
                    <td>{{target_delta_lab_unit[0].toFixed(2)}}</td>
                    <td>{{target_delta_lab_unit[1].toFixed(2)}}</td>
                    <td>{{target_delta_lab_unit[2].toFixed(2)}}</td>
                </tr>
                <tr>
                    <td>XYZ:</td>
                    <td>{{target_delta_xyz_unit[0].toFixed(2)}}</td>
                    <td>{{target_delta_xyz_unit[1].toFixed(2)}}</td>
                    <td>{{target_delta_xyz_unit[2].toFixed(2)}}</td>
                </tr>
            </tbody></v-table>
            </v-expansion-panel-text></v-expansion-panel>
            </template>
            <template v-if="detail > DETAIL_LEVEL.PARTIAL">
            <v-expansion-panel title="&Delta; from Current"><v-expansion-panel-text>
            <v-table><tbody>
                <tr>
                    <td>Lab:</td>
                    <td>{{current_delta_lab[0].toFixed(2)}}</td>
                    <td>{{current_delta_lab[1].toFixed(2)}}</td>
                    <td>{{current_delta_lab[2].toFixed(2)}}</td>
                </tr>
                <tr>
                    <td>&Delta;E</td>
                    <td colspan="3">{{current_delta_e.toFixed(4)}}</td>
                </tr>
                <tr>
                    <td>XYZ:</td>
                    <td>{{current_delta_xyz[0].toFixed(2)}}</td>
                    <td>{{current_delta_xyz[1].toFixed(2)}}</td>
                    <td>{{current_delta_xyz[2].toFixed(2)}}</td>
                </tr>
                <tr>
                    <td>|&Delta;|</td>
                    <td colspan="3">{{current_distance.toFixed(4)}}</td>
                </tr>
            </tbody></v-table>
            </v-expansion-panel-text></v-expansion-panel>
            <v-expansion-panel title="Normalized &Delta; from Current"><v-expansion-panel-text>
            <v-table><tbody>
                <tr>
                    <td>Lab:</td>
                    <td>{{current_delta_lab_unit[0].toFixed(2)}}</td>
                    <td>{{current_delta_lab_unit[1].toFixed(2)}}</td>
                    <td>{{current_delta_lab_unit[2].toFixed(2)}}</td>
                </tr>
                <tr>
                    <td>XYZ:</td>
                    <td>{{current_delta_xyz_unit[0].toFixed(2)}}</td>
                    <td>{{current_delta_xyz_unit[1].toFixed(2)}}</td>
                    <td>{{current_delta_xyz_unit[2].toFixed(2)}}</td>
                </tr>
            </tbody></v-table>
            </v-expansion-panel-text></v-expansion-panel>
            </template>
            <template v-if="detail > DETAIL_LEVEL.NO_THETA">
            <v-table><tbody>
                <tr>
                    <td>&Theta;:</td>
                    <td colspan="3">{{theta.toFixed(4)}}</td>
                </tr>
            </tbody></v-table>
            </template>
        </v-expansion-panels>`
};
