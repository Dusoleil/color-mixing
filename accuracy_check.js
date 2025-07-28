import {Color} from "color"
import {vec3} from "glMatrix"

export var accuracy_check =
{
    data()
    {return{
        moving_comp:null,
        add_or_remove:true,
        delta_after_move:[0,0,0]
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
            return this.$store.state.comp_colors.map((col) => {return {"value":col,"title":col.name}});
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
        angle()
        {
            return vec3.angle(this.expected_move,this.actual_move);
        },
        mobile_num_input()
        {
            return this.$vuetify.display.mobile ? 'hidden' : 'stacked';
        }
    },
    watch:
    {
        comp_colors()
        {
            this.moving_comp = this.comp_colors[0].value;
        }
    },
    template:/*html*/`
        <v-card title="Check Accuracy" class="mx-auto mt-10" :style="{'max-width':'max-content'}"><v-card-text>
            <div class="d-flex ga-4">
                <v-select :style="{'min-width':'14em'}" label="Component Adjusted" :items="comp_colors" v-model="moving_comp"></v-select>
                <v-switch prepend-icon="mdi-minus" append-icon="mdi-plus" v-model="add_or_remove" @click:prepend="add_or_remove = false" @click:append="add_or_remove = true"></v-switch>
            </div>
            <v-label text="&Delta;Lab After Adjustment" class="mb-2"></v-label>
            <div class="d-flex ga-4">
                <v-text-field type="number" :style="{'min-width':'8ch'}" :control-variant="mobile_num_input" label="&Delta;L" :min="-100" :max="100" :step="0.01" v-model.number="delta_after_move[0]"></v-text-field>
                <v-text-field type="number" :style="{'min-width':'8ch'}" :control-variant="mobile_num_input" label="&Delta;a" :min="-255" :max="255" :step="0.01" v-model.number="delta_after_move[1]"></v-text-field>
                <v-text-field type="number" :style="{'min-width':'8ch'}" :control-variant="mobile_num_input" label="&Delta;b" :min="-255" :max="255" :step="0.01" v-model.number="delta_after_move[2]"></v-text-field>
            </div>
            <v-table v-if="target && current && moving_comp"><tbody>
                <tr>
                    <td>Before:</td>
                    <td>{{current.X.toFixed(2)}}</td>
                    <td>{{current.Y.toFixed(2)}}</td>
                    <td>{{current.Z.toFixed(2)}}</td>
                </tr>
                <tr>
                    <td>After:</td>
                    <td>{{color_after_move.X.toFixed(2)}}</td>
                    <td>{{color_after_move.Y.toFixed(2)}}</td>
                    <td>{{color_after_move.Z.toFixed(2)}}</td>
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
                    <td>Accuracy &Theta;:</td>
                    <td colspan="3">{{angle.toFixed(4)}}</td>
                </tr>
            </tbody></v-table>
        </v-card-text></v-card>`
};
