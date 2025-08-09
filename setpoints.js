import * as proj from "projections"
import {vec3} from "glMatrix"

export var setpoints =
{
    data()
    {return{
        old_sp:[0,0,0,0],
        fix1:0,
        fix2:0,
        fix2_sum:51
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
            return this.$store.state.comp_colors.map((col,idx) => {return {"value":idx,"title":col.name}});
        },
        target_barycentric()
        {
            return this.barycentric_coords(this.target,this.comp_colors);
        },
        current_barycentric()
        {
            return this.barycentric_coords(this.current,this.comp_colors);
        },
        fix1_sp()
        {
            let sp = [];
            for(let color in this.comp_colors)
            {
                if(color == this.fix1)
                {
                    sp.push(this.old_sp[color]);
                    continue;
                }
                sp.push(proj.calculate_setpoint(this.old_sp[color],this.old_sp[this.fix1],this.old_sp[this.fix1],this.current_barycentric[color],this.target_barycentric[color],this.current_barycentric[this.fix1],this.target_barycentric[this.fix1]));
            }
            return sp;
        },
        fix2_sp()
        {
            let fixed_sp = proj.calculate_setpoints_fixed_sum(this.old_sp[this.fix1],this.old_sp[this.fix2],this.fix2_sum,this.current_barycentric[this.fix1],this.current_barycentric[this.fix2],this.target_barycentric[this.fix1],this.target_barycentric[this.fix2]);
            let sp = [];
            for(let color in this.comp_colors)
            {
                if(color == this.fix1)
                {
                    sp.push(fixed_sp[0]);
                    continue;
                }
                if(color == this.fix2)
                {
                    sp.push(fixed_sp[1]);
                    continue;
                }
                sp.push(proj.calculate_setpoint(this.old_sp[color],this.old_sp[this.fix1],this.old_sp[this.fix1],this.current_barycentric[color],this.target_barycentric[color],this.current_barycentric[this.fix1],this.target_barycentric[this.fix1]));
            }
            return sp;
        }
    },
    methods:
    {
        barycentric_coords(p,h)
        {
            if(h.length == 1)
                return proj.barycentric_point(p.XYZ,h[0].XYZ);
            if(h.length == 2)
                return proj.barycentric_line_bounded(p.XYZ,h[0].XYZ,h[1].XYZ);
            if(h.length == 3)
                return proj.barycentric_triangle_bounded(p.XYZ,h[0].XYZ,h[1].XYZ,h[2].XYZ);
            if(h.length >= 4)
                return proj.barycentric_tetrahedron_bounded(p.XYZ,h[0].XYZ,h[1].XYZ,h[2].XYZ,h[3].XYZ);
        }
    },
    template:/*html*/`
        <div class="mx-auto mt-10 mb-4 d-flex flex-wrap justify-center ga-4" :style="{'max-width':'85dvw'}">
            <v-card elevation="10">
                <v-card-title>Current Setpoints</v-card-title>
                <v-card-subtitle>
                    <template v-if="comp_colors.length <= 1">
                        Not Enough Component Colors to Work With
                    </template>
                    <template v-if="comp_colors.length == 2">
                        Two Component Colors
                    </template>
                    <template v-if="comp_colors.length == 3">
                        Three Component Colors
                    </template>
                    <template v-if="comp_colors.length >= 4">
                        Four Component Colors
                    </template>
                </v-card-subtitle>
                <v-card-text v-if="comp_colors.length >= 2" class="d-flex flex-column justify-center">
                    <v-number-input onbeforeinput="event.stopPropagation()" v-for="(color,idx) in comp_colors" inset control-variant="stacked" density="compact" :label="color.name" v-model="old_sp[idx]" type="number" :precision="4"></v-number-input>
                </v-card-text>
            </v-card>
            <v-card v-if="comp_colors.length >= 2" elevation="10">
                <v-card-title>New Setpoints</v-card-title>
                <v-card-subtitle>One Component Stays Fixed</v-card-subtitle>
                <v-card-text class="d-flex flex-column justify-center">
                    <v-select :style="{'min-width':'14em'}" density="compact" label="Fixed Component" :items="comp_colors_select" v-model="fix1"></v-select>
                    <v-number-input v-for="(color,idx) in comp_colors" control-variant="hidden" density="compact" :label="color.name" v-model="fix1_sp[idx]" :precision="4" disabled></v-number-input>
                    </v-card-text>
            </v-card>
            <v-card v-if="comp_colors.length >= 2" elevation="10">
                <v-card-title>New Setpoints</v-card-title>
                <v-card-subtitle>Two Components Add to a Fixed Sum</v-card-subtitle>
                <v-card-text class="d-flex flex-column justify-center">
                    <v-select :style="{'min-width':'14em'}" density="compact" label="Addend Component 1" :items="comp_colors_select" v-model="fix1"></v-select>
                    <v-select :style="{'min-width':'14em'}" density="compact" label="Addend Component 2" :items="comp_colors_select" v-model="fix2"></v-select>
                    <v-number-input inset control-variant="stacked" density="compact" label="Fixed Sum" v-model="fix2_sum" :precision="4"></v-number-input>
                    <v-label v-if="fix1 == fix2">Selected Components Must Be Different</v-label>
                    <template v-else>
                        <v-number-input v-for="(color,idx) in comp_colors" control-variant="hidden" density="compact" :label="color.name" v-model="fix2_sp[idx]" :precision="4" disabled></v-number-input>
                    </template>
                </v-card-text>
            </v-card>
        </div>`
};
