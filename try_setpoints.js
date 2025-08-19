import * as predict from "predictions"
import {color_viewer} from "color_viewer"
import {DETAIL_LEVEL} from "color_detail"

export var try_setpoints =
{
    data()
    {return{
        old_sp:[0,0,0,0],
        new_sp:[0,0,0,0]
    }},
    created()
    {
        this.DETAIL_LEVEL = DETAIL_LEVEL;
    },
    computed:
    {
        current()
        {
            return this.$store.state.current_color;
        },
        comp_colors()
        {
            return this.$store.state.comp_colors;
        },
        prediction_by_barycentric()
        {
            return predict.predict_color_by_barycentric(this.current.XYZ,this.comp_colors.map((c)=>c.XYZ),this.old_sp,this.new_sp);
        },
        prediction_by_ratios()
        {
            let n = [...this.new_sp];
            if(n.every((p,i)=>p!=this.old_sp[i]||(p==0)))
                n[0] = this.old_sp[0];
            return predict.predict_color_by_ratio(this.current.XYZ,this.comp_colors.map((c)=>c.XYZ),this.old_sp,n);
        }
    },
    watch:
    {
        comp_colors()
        {
            this.old_sp = [0,0,0,0];
            this.new_sp = [0,0,0,0];
        }
    },
    components:
    {
        "color-viewer":color_viewer
    },
    template:/*html*/`
        <div class="mx-auto mt-10 mb-4 d-flex flex-wrap justify-center ga-4" :style="{'max-width':'85dvw'}">
        <v-card v-if="current" title="Try Setpoints" elevation="10" class="mb-4" :style="{'max-width':'max-content'}">
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
            <v-card-text v-if="comp_colors.length >= 2">
            <div class="d-flex justify-center ga-4">
                <v-label text="Old Setpoints" class="mb-2 mx-auto"></v-label>
                <v-label text="New Setpoints" class="mb-2 mx-auto"></v-label>
            </div>
            <div v-for="(color,idx) in comp_colors" class="d-flex justify-center ga-4">
                <v-number-input onbeforeinput="event.stopPropagation()" width="" density="compact" :label="color.name" :min="0" :precision="4" v-model="old_sp[idx]"></v-number-input>
                <v-number-input onbeforeinput="event.stopPropagation()" width="" density="compact" :label="color.name" :min="0" :precision="4" v-model="new_sp[idx]"></v-number-input>
            </div>
        </v-card-text></v-card>
        <color-viewer :detail="DETAIL_LEVEL.NO_THETA" v-if="comp_colors.length >= 2" :color="prediction_by_ratios" class="mb-4"></color-viewer>
        <color-viewer :detail="DETAIL_LEVEL.NO_THETA" v-if="comp_colors.length >= 2" :color="prediction_by_barycentric"></color-viewer>
        </div>`
};
