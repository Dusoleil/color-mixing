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
            return this.$store.state.comp_colors;
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
        }
    },
    watch:
    {
        comp_colors()
        {
            this.moving_comp = this.comp_colors[0];
        }
    },
    template:/*html*/`
        <div>
            <form id="check-accuracy">
                <div>
                    <label for="acc-select">Component to Move</label>
                    <select id="acc-select" v-model="moving_comp">
                        <option v-for="color in comp_colors" :value="color">{{color.name}}</option>
                    </select>
                    <label for="acc-direction">Add or Remove</label>
                    <input type="checkbox" id="acc-direction" v-model="add_or_remove" checked \>
                </div>
                <div>
                    <label for="acc-L">&Delta;L</label>
                    <input type="number" id="acc-L" class="lab" min="0" max="100" step="0.01" v-model="delta_after_move[0]" \>
                    <label for="acc-a">&Delta;a</label>
                    <input type="number" id="acc-a" class="lab" min="-255" max="255" step="0.01" v-model="delta_after_move[1]" \>
                    <label for="acc-b">&Delta;b</label>
                    <input type="number" id="acc-b" class="lab" min="-255" max="255" step="0.01" v-model="delta_after_move[2]" \>
                </div>
            </form>
            <table id="display-accuracy" v-if="target && current && moving_comp"><tbody>
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
            </tbody></table>
        </div>`
};
