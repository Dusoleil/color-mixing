import {plot} from "plot"
import {color_viewer} from "color_viewer"
import {DETAIL_LEVEL} from "color_detail"
import {Color} from "color"
import * as proj from "projections"
import {vec3} from "glMatrix"

export var validity_check =
{
    created()
    {
        this.DETAIL_LEVEL = DETAIL_LEVEL;
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
        comp_colors()
        {
            return this.$store.state.comp_colors;
        },
        target_closest_to_hull()
        {
            return this.closest_to_hull(this.target,this.comp_colors);
        },
        current_closest_to_hull()
        {
            return this.closest_to_hull(this.current,this.comp_colors);
        },
        target_barycentric()
        {
            return this.barycentric_coords(this.target,this.comp_colors);
        },
        current_barycentric()
        {
            return this.barycentric_coords(this.current,this.comp_colors);
        }
    },
    methods:
    {
        closest_to_hull(p,h)
        {
            let projection = proj.project_onto_hull(p.XYZ,h.map((c)=>c.XYZ));
            return Color.from_xyz(`Closest Possible to ${p.name}`,projection);
        },
        barycentric_coords(p,h)
        {
            return proj.barycentric_hull_bounded(p.XYZ,h.map((c)=>c.XYZ));
        }
    },
    components:
    {
        "plot":plot,
        "color-viewer":color_viewer
    },
    template:/*html*/`
        <div class="mx-auto mt-10 mb-4" :style="{'max-width':'85dvw'}">
            <plot v-if="comp_colors.length >= 1"></plot>
            <v-card elevation="10">
                <v-card-title>Estimated Makeup</v-card-title>
                <v-card-subtitle>
                    <template v-if="comp_colors.length < 1">
                        No Component Colors to Work With
                    </template>
                    <template v-if="comp_colors.length == 1">
                        One Component Color
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
                <v-card-text v-if="comp_colors.length >= 1">
                    <v-label>Target:</v-label>
                    <v-progress-linear v-for="(color,idx) in comp_colors" :color="color.hex" v-model="target_barycentric[idx]" max="1" height="25">
                        {{color.name}} : {{target_barycentric[idx].toFixed(4)}}
                    </v-progress-linear>
                    <v-label class="mt-4">Current:</v-label>
                    <v-progress-linear v-for="(color,idx) in comp_colors" :color="color.hex" v-model="current_barycentric[idx]" max="1" height="25">
                        {{color.name}} : {{current_barycentric[idx].toFixed(4)}}
                    </v-progress-linear>
                </v-card-text>
            </v-card>
            <div class="d-flex flex-wrap justify-center mt-8 ga-16">
                <color-viewer :detail="DETAIL_LEVEL.PARTIAL" v-if="comp_colors.length >= 1" :color="target_closest_to_hull"></color-viewer>
                <color-viewer :detail="DETAIL_LEVEL.PARTIAL" v-if="comp_colors.length >= 1" :color="current_closest_to_hull"></color-viewer>
            </div>
        </div>`
};
