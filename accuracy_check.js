import {Color} from "color"
import * as proj from "projections"
import * as predict from "predictions"
import {vec3} from "glMatrix"

export var accuracy_check =
{
    data()
    {return{
        moving_comp:null,
        add_or_remove:true,
        delta_after_move:[0,0,0],
        old_sp:[0,0,0,0],
        new_sp:[0,0,0,0]
    }},
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
        comp_colors()
        {
            return this.$store.state.comp_colors;
        },
        comp_colors_select()
        {
            return this.comp_colors.map((col) => {return {"value":col,"title":col.name}});
        },
        color_after_move()
        {
            let c = vec3.create();
            vec3.add(c,this.target.Lab,this.delta_after_move);
            return new Color("Accuracy Check",c);
        },
        expected_move()
        {
            let e = vec3.create();
            vec3.sub(e,this.moving_comp.XYZ,this.current.XYZ);
            vec3.scale(e,e,this.add_or_remove?1:-1);
            vec3.normalize(e,e);
            return e;
        },
        actual_move()
        {
            let a = vec3.create();
            vec3.sub(a,this.color_after_move.XYZ,this.current.XYZ);
            vec3.normalize(a,a);
            return a;
        },
        old_delta_e()
        {
            return vec3.distance(this.current.Lab,this.target.Lab);
        },
        new_delta_e()
        {
            return vec3.distance(this.color_after_move.Lab,this.target.Lab);
        },
        angle()
        {
            return vec3.angle(this.expected_move,this.actual_move);
        },
        prediction_by_barycentric()
        {
            return predict.predict_color_by_barycentric(this.current.XYZ,this.comp_colors.map((c)=>c.XYZ),this.old_sp,this.new_sp);
        },
        bary_delta_e()
        {
            return vec3.distance(this.prediction_by_barycentric.Lab,this.target.Lab);
        },
        bary_trajectory()
        {
            let a = vec3.create();
            vec3.sub(a,this.prediction_by_barycentric.XYZ,this.current.XYZ);
            vec3.normalize(a,a);
            return a;
        },
        bary_angle()
        {
            return vec3.angle(this.bary_trajectory,this.actual_move);
        },
        bary_magnitude()
        {
            return vec3.distance(this.current.XYZ,this.prediction_by_barycentric.XYZ);
        },
        actual_magnitude()
        {
            return vec3.distance(this.current.XYZ,this.color_after_move.XYZ);
        },
        mobile_num_input()
        {
            return this.$vuetify.display.mobile ? 'hidden' : 'stacked';
        }
    },
    watch:
    {
        comp_colors_select()
        {
            this.moving_comp = this.comp_colors_select[0].value;
            this.old_sp = [0,0,0,0];
            this.new_sp = [0,0,0,0];
        }
    },
    methods:
    {
        load_into_current()
        {
            this.$store.commit("set_current",{Lab:this.delta_after_move,delta:true});
        },
        rad_to_deg(rad)
        {
            return proj.rad_to_deg(rad);
        }
    },
    mounted()
    {
        if(this.comp_colors_select.length > 0)
            this.moving_comp = this.comp_colors_select[0].value;
    },
    template:/*html*/`
        <div class="mx-auto mt-10 mb-4 d-flex flex-wrap justify-center ga-4" :style="{'max-width':'85dvw'}">
        <v-card title="Single Trajectory Accuracy" elevation="10" :style="{'max-width':'max-content'}"><v-card-text>
            <div class="d-flex ga-4">
                <v-select :style="{'min-width':'14em'}" label="Component Adjusted" :items="comp_colors_select" v-model="moving_comp"></v-select>
                <v-switch :prepend-icon="$vuetify.display.mobile?'':'mdi-minus'" :false-icon="$vuetify.display.mobile?'mdi-minus':''" :append-icon="$vuetify.display.mobile?'':'mdi-plus'" :true-icon="$vuetify.display.mobile?'mdi-plus':''" v-model="add_or_remove" @click:prepend="add_or_remove = false" @click:append="add_or_remove = true"></v-switch>
            </div>
            <v-label text="&Delta;Lab After Adjustment" class="mb-2"></v-label>
            <div class="d-flex ga-4">
                <v-number-input onbeforeinput="event.stopPropagation()" :control-variant="mobile_num_input" label="&Delta;L" :min="-100" :max="100" :step="0.01" :precision="2" v-model="delta_after_move[0]"></v-number-input>
                <v-number-input onbeforeinput="event.stopPropagation()" :control-variant="mobile_num_input" label="&Delta;a" :min="-255" :max="255" :step="0.01" :precision="2" v-model="delta_after_move[1]"></v-number-input>
                <v-number-input onbeforeinput="event.stopPropagation()" :control-variant="mobile_num_input" label="&Delta;b" :min="-255" :max="255" :step="0.01" :precision="2" v-model="delta_after_move[2]"></v-number-input>
            </div>
            <v-btn color="primary" class="mb-4" @click="load_into_current">
                Load This Color Into Current
            </v-btn>
            <v-table v-if="target && current && moving_comp"><tbody>
                <tr>
                    <td>Old &Delta;E:</td>
                    <td colspan="3">{{old_delta_e.toFixed(4)}}</td>
                </tr>
                <tr>
                    <td>New &Delta;E:</td>
                    <td colspan="3">{{new_delta_e.toFixed(4)}}</td>
                </tr>
                <tr>
                    <td>Expected &Delta;:</td>
                    <td>{{expected_move[0].toFixed(2)}}</td>
                    <td>{{expected_move[1].toFixed(2)}}</td>
                    <td>{{expected_move[2].toFixed(2)}}</td>
                </tr>
                <tr>
                    <td>Actual &Delta;:</td>
                    <td>{{actual_move[0].toFixed(2)}}</td>
                    <td>{{actual_move[1].toFixed(2)}}</td>
                    <td>{{actual_move[2].toFixed(2)}}</td>
                </tr>
                <tr>
                    <td>Accuracy &Theta; (Rad):</td>
                    <td colspan="3">{{angle.toFixed(4)}}</td>
                </tr>
                <tr>
                    <td>Accuracy &Theta; (Deg):</td>
                    <td colspan="3">{{rad_to_deg(angle).toFixed(4)}}</td>
                </tr>
            </tbody></v-table>
        </v-card-text></v-card>
        <v-card v-if="target && current" title="Barycentric Setpoint Accuracy" elevation="10" class="mb-4" :style="{'max-width':'max-content'}"><v-card-text>
            <div class="d-flex justify-center ga-4">
                <v-label text="Old Setpoints" class="mb-2 mx-auto"></v-label>
                <v-label text="New Setpoints" class="mb-2 mx-auto"></v-label>
            </div>
            <div v-for="(color,idx) in comp_colors" class="d-flex justify-center ga-4">
                <v-number-input onbeforeinput="event.stopPropagation()" width="" density="compact" :label="color.name" :min="0" :precision="4" v-model="old_sp[idx]"></v-number-input>
                <v-number-input onbeforeinput="event.stopPropagation()" width="" density="compact" :label="color.name" :min="0" :precision="4" v-model="new_sp[idx]"></v-number-input>
            </div>
            <v-label text="&Delta;Lab After Adjustment" class="mb-2"></v-label>
            <div class="d-flex ga-4">
                <v-number-input onbeforeinput="event.stopPropagation()" :control-variant="mobile_num_input" label="&Delta;L" :min="-100" :max="100" :step="0.01" :precision="2" v-model="delta_after_move[0]"></v-number-input>
                <v-number-input onbeforeinput="event.stopPropagation()" :control-variant="mobile_num_input" label="&Delta;a" :min="-255" :max="255" :step="0.01" :precision="2" v-model="delta_after_move[1]"></v-number-input>
                <v-number-input onbeforeinput="event.stopPropagation()" :control-variant="mobile_num_input" label="&Delta;b" :min="-255" :max="255" :step="0.01" :precision="2" v-model="delta_after_move[2]"></v-number-input>
            </div>
            <v-btn color="primary" class="mb-4" @click="load_into_current">
                Load This Color Into Current
            </v-btn>
            <v-table v-if="target && current && comp_colors.length >= 2"><tbody>
                <tr>
                    <td>Old &Delta;E:</td>
                    <td colspan="3">{{old_delta_e.toFixed(4)}}</td>
                </tr>
                <tr>
                    <td>Predicted &Delta;E:</td>
                    <td colspan="3">{{bary_delta_e.toFixed(4)}}</td>
                </tr>
                <tr>
                    <td>New &Delta;E:</td>
                    <td colspan="3">{{new_delta_e.toFixed(4)}}</td>
                </tr>
                <tr>
                    <td>Expected &Delta;:</td>
                    <td>{{bary_trajectory[0].toFixed(2)}}</td>
                    <td>{{bary_trajectory[1].toFixed(2)}}</td>
                    <td>{{bary_trajectory[2].toFixed(2)}}</td>
                </tr>
                <tr>
                    <td>Actual &Delta;:</td>
                    <td>{{actual_move[0].toFixed(2)}}</td>
                    <td>{{actual_move[1].toFixed(2)}}</td>
                    <td>{{actual_move[2].toFixed(2)}}</td>
                </tr>
                <tr>
                    <td>Accuracy &Theta; (Rad):</td>
                    <td colspan="3">{{bary_angle.toFixed(4)}}</td>
                </tr>
                <tr>
                    <td>Accuracy &Theta; (Deg):</td>
                    <td colspan="3">{{rad_to_deg(bary_angle).toFixed(4)}}</td>
                </tr>
                <tr>
                    <td>Expected Magnitude:</td>
                    <td colspan="3">{{bary_magnitude.toFixed(4)}}</td>
                </tr>
                <tr>
                    <td>Actual Magnitude:</td>
                    <td colspan="3">{{actual_magnitude.toFixed(4)}}</td>
                </tr>
                <tr>
                    <td>Magnitude Accuracy:</td>
                    <td colspan="3">{{(Math.abs(actual_magnitude-bary_magnitude)).toFixed(4)}}</td>
                </tr>
            </tbody></v-table>
        </v-card-text></v-card>
        </div>`
};
