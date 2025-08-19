import * as proj from "projections"
import * as predict from "predictions"

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
            let sp = this.comp_colors.map((_,color)=>
            {
                if(color == this.fix1)
                    return this.old_sp[color];
                return predict.calculate_setpoint(this.old_sp[color],this.old_sp[this.fix1],this.old_sp[this.fix1],this.current_barycentric[color],this.target_barycentric[color],this.current_barycentric[this.fix1],this.target_barycentric[this.fix1]);
            });
            return sp;
        },
        fix2_sp()
        {
            let fixed_sp = predict.calculate_setpoints_fixed_sum(this.old_sp[this.fix1],this.old_sp[this.fix2],this.fix2_sum,this.current_barycentric[this.fix1],this.current_barycentric[this.fix2],this.target_barycentric[this.fix1],this.target_barycentric[this.fix2]);
            let sp = this.comp_colors.map((_,color)=>
            {
                if(color == this.fix1)
                    return fixed_sp[0];
                if(color == this.fix2)
                    return fixed_sp[1];
                return predict.calculate_setpoint(this.old_sp[color],this.old_sp[this.fix1],fixed_sp[0],this.current_barycentric[color],this.target_barycentric[color],this.current_barycentric[this.fix1],this.target_barycentric[this.fix1]);
            });
            return sp;
        },
        fix1_sp_ratios()
        {
            let current = this.current.XYZ;
            let target = this.target.XYZ;
            let anchor = this.comp_colors.find((_,c)=>c==this.fix1).XYZ;
            let moving_comps = this.comp_colors.filter((_,c)=>c!=this.fix1).map((c)=>c.XYZ);
            let moving_sps = this.old_sp.filter((_,s)=>s!=this.fix1);
            let new_sp = predict.calculate_setpoints_by_ratio(current,target,anchor,moving_comps,moving_sps);
            new_sp.splice(this.fix1,0,this.old_sp[this.fix1]);
            return new_sp;
        }
    },
    watch:
    {
        comp_colors()
        {
            this.old_sp = [0,0,0,0];
        }
    },
    methods:
    {
        barycentric_coords(p,h)
        {
            return proj.barycentric_hull_bounded(p.XYZ,h.map((c)=>c.XYZ));
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
                    <v-number-input onbeforeinput="event.stopPropagation()" v-for="(color,idx) in comp_colors" width="" density="compact" :label="color.name" v-model="old_sp[idx]" :min="0" :precision="4"></v-number-input>
                </v-card-text>
            </v-card>
            <v-card v-if="comp_colors.length >= 2" elevation="10">
                <v-card-title>New Setpoints (Method 1)</v-card-title>
                <v-card-subtitle>One Component Stays Fixed</v-card-subtitle>
                <v-card-text class="d-flex flex-column justify-center">
                    <v-select :style="{'min-width':'14em'}" density="compact" label="Fixed Component" :items="comp_colors_select" v-model="fix1"></v-select>
                    <v-number-input v-for="(color,idx) in comp_colors" control-variant="hidden" width="" density="compact" :label="color.name" v-model="fix1_sp_ratios[idx]" :precision="4" disabled></v-number-input>
                </v-card-text>
            </v-card>
            <v-card v-if="comp_colors.length >= 2" elevation="10">
                <v-card-title>New Setpoints (Method 2)</v-card-title>
                <v-card-subtitle>One Component Stays Fixed</v-card-subtitle>
                <v-card-text class="d-flex flex-column justify-center">
                    <v-select :style="{'min-width':'14em'}" density="compact" label="Fixed Component" :items="comp_colors_select" v-model="fix1"></v-select>
                    <v-number-input v-for="(color,idx) in comp_colors" control-variant="hidden" width="" density="compact" :label="color.name" v-model="fix1_sp[idx]" :precision="4" disabled></v-number-input>
                </v-card-text>
            </v-card>
            <v-card v-if="comp_colors.length >= 2" elevation="10">
                <v-card-title>New Setpoints</v-card-title>
                <v-card-subtitle>Two Components Add to a Fixed Sum</v-card-subtitle>
                <v-card-text class="d-flex flex-column justify-center">
                    <v-select :style="{'min-width':'14em'}" density="compact" label="Addend Component 1" :items="comp_colors_select" v-model="fix1"></v-select>
                    <v-select :style="{'min-width':'14em'}" density="compact" label="Addend Component 2" :items="comp_colors_select" v-model="fix2"></v-select>
                    <v-number-input onbeforeinput="event.stopPropagation()" width="" density="compact" label="Fixed Sum" v-model="fix2_sum" :min="0" :precision="4"></v-number-input>
                    <v-label v-if="fix1 == fix2">Selected Components Must Be Different</v-label>
                    <template v-else>
                        <v-number-input v-for="(color,idx) in comp_colors" control-variant="hidden" width="" density="compact" :label="color.name" v-model="fix2_sp[idx]" :precision="4" disabled></v-number-input>
                    </template>
                </v-card-text>
            </v-card>
        </div>`
};
