import {plot} from "plot"
import {color_viewer} from "color_viewer"
import {DETAIL_LEVEL} from "color_detail"
import {Color} from "color"
import * as proj from "projections"
import {vec3} from "glMatrix"

export var validity_check =
{
    data()
    {return{
        old_sp:[0,0,0,0]
    }},
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
        target_distance_to_hull()
        {
            return this.distance_to_hull(this.target,this.comp_colors);
        },
        current_distance_to_hull()
        {
            return this.distance_to_hull(this.current,this.comp_colors);
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
        },
        new_sp()
        {
            if(this.comp_colors.length < 2)
                return [0,0,0,0];
            return proj.calculate_setpoints(this.old_sp,this.current_barycentric,this.target_barycentric);
        }
    },
    watch:
    {
        comp_colors()
        {
            this.old_sp.fill(0);
        }
    },
    methods:
    {
        distance_to_hull(p,h)
        {
            if(h.length == 1)
                return proj.point_to_point_distance(p.XYZ,h[0].XYZ);
            if(h.length == 2)
                return proj.point_to_line_distance(p.XYZ,h[0].XYZ,h[1].XYZ);
            if(h.length == 3)
                return proj.point_to_triangle_distance(p.XYZ,h[0].XYZ,h[1].XYZ,h[2].XYZ);
            if(h.length >= 4)
                return proj.point_to_tetrahedron_distance(p.XYZ,h[0].XYZ,h[1].XYZ,h[2].XYZ,h[3].XYZ);
        },
        closest_to_hull(p,h)
        {
            if(h.length == 1)
                return proj.point_to_point_distance(p.XYZ,h[0].XYZ);
            if(h.length == 2)
            {
                let projection = proj.project_onto_line_segment(p.XYZ,h[0].XYZ,h[1].XYZ);
                return Color.from_xyz(`Closest Possible to ${p.name}`,projection);
            }
            if(h.length == 3)
            {
                let projection = proj.project_onto_triangle(p.XYZ,h[0].XYZ,h[1].XYZ,h[2].XYZ);
                return Color.from_xyz(`Closest Possible to ${p.name}`,projection);
            }
            if(h.length >= 4)
            {
                let projection = proj.project_onto_tetrahedron(p.XYZ,h[0].XYZ,h[1].XYZ,h[2].XYZ,h[3].XYZ);
                return Color.from_xyz(`Closest Possible to ${p.name}`,projection);
            }
        },
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
    components:
    {
        "plot":plot,
        "color-viewer":color_viewer
    },
    template:/*html*/`
        <div class="mx-auto mt-10 mb-4" :style="{'max-width':'85dvw'}">
            <plot v-if="comp_colors.length >= 1"></plot>
            <v-card title="Closest Possible Colors" elevation="10"><v-card-text>
                <template v-if="comp_colors.length < 1">
                    <v-label>No Component Colors to Work With</v-label>
                </template>
                <template v-if="comp_colors.length == 1">
                    <v-label>One Component Color</v-label>
                    <v-divider color="primary"></v-divider>
                    {{target.name}} is {{target_distance_to_hull.toFixed(4)}} away from {{comp_colors[0].name}}
                    <v-divider class="border-opacity-0"></v-divider>
                    {{current.name}} is {{current_distance_to_hull.toFixed(4)}} away from {{comp_colors[0].name}}
                </template>
                <template v-if="comp_colors.length == 2">
                    <v-label>Two Component Colors</v-label>
                    <v-divider class="border-opacity-0"></v-divider>
                    {{target.name}} is {{target_distance_to_hull.toFixed(4)}} away from the line.
                    <v-divider class="border-opacity-0"></v-divider>
                    {{current.name}} is {{current_distance_to_hull.toFixed(4)}} away from the line.
                    <v-divider class="border-opacity-0"></v-divider>
                    The estimated makeup of {{target.name}} is {{target_barycentric[0].toFixed(4)}} {{comp_colors[0].name}} and {{target_barycentric[1].toFixed(4)}} {{comp_colors[1].name}}.
                    <v-divider class="border-opacity-0"></v-divider>
                    The estimated makeup of {{current.name}} is {{current_barycentric[0].toFixed(4)}} {{comp_colors[0].name}} and {{current_barycentric[1].toFixed(4)}} {{comp_colors[1].name}}.
                    <v-divider class="border-opacity-0"></v-divider>
                    <v-text-field type="number" :style="{'min-width':'12ch'}" :label="comp_colors[1].name+' SP'" v-model.number="old_sp[1]"></v-text-field>
                    <v-text-field disabled type="number" :style="{'min-width':'12ch'}" label="New SP" v-model.number="new_sp[1]"></v-text-field>
                    <v-divider class="border-opacity-0"></v-divider>
                </template>
                <template v-if="comp_colors.length == 3">
                    <v-label>Three Component Colors</v-label>
                    <v-divider class="border-opacity-0"></v-divider>
                    {{target.name}} is {{target_distance_to_hull.toFixed(4)}} away from the triangle.
                    <v-divider class="border-opacity-0"></v-divider>
                    {{current.name}} is {{current_distance_to_hull.toFixed(4)}} away from the triangle.
                    <v-divider class="border-opacity-0"></v-divider>
                    The estimated makeup of {{target.name}} is {{target_barycentric[0].toFixed(4)}} {{comp_colors[0].name}}, {{target_barycentric[1].toFixed(4)}} {{comp_colors[1].name}}, and {{target_barycentric[2].toFixed(4)}} {{comp_colors[2].name}}.
                    <v-divider class="border-opacity-0"></v-divider>
                    The estimated makeup of {{current.name}} is {{current_barycentric[0].toFixed(4)}} {{comp_colors[0].name}}, {{current_barycentric[1].toFixed(4)}} {{comp_colors[1].name}}, and {{current_barycentric[2].toFixed(4)}} {{comp_colors[2].name}}.
                    <v-divider class="border-opacity-0"></v-divider>
                    <v-text-field type="number" :style="{'min-width':'12ch'}" :label="comp_colors[1].name+' SP'" v-model.number="old_sp[1]"></v-text-field>
                    <v-text-field disabled type="number" :style="{'min-width':'12ch'}" label="New SP" v-model.number="new_sp[1]"></v-text-field>
                    <v-text-field type="number" :style="{'min-width':'12ch'}" :label="comp_colors[2].name+' SP'" v-model.number="old_sp[2]"></v-text-field>
                    <v-text-field disabled type="number" :style="{'min-width':'12ch'}" label="New SP" v-model.number="new_sp[2]"></v-text-field>
                    <v-divider class="border-opacity-0"></v-divider>
                </template>
                <template v-if="comp_colors.length >= 4">
                    <v-label>Four Component Colors</v-label>
                    <v-divider class="border-opacity-0"></v-divider>
                    {{target.name}} is {{target_distance_to_hull.toFixed(4)}} away from the convex hull.
                    <v-divider class="border-opacity-0"></v-divider>
                    {{current.name}} is {{current_distance_to_hull.toFixed(4)}} away from the convex hull.
                    <v-divider class="border-opacity-0"></v-divider>
                    The estimated makeup of {{target.name}} is {{target_barycentric[0].toFixed(4)}} {{comp_colors[0].name}}, {{target_barycentric[1].toFixed(4)}} {{comp_colors[1].name}}, {{target_barycentric[2].toFixed(4)}} {{comp_colors[2].name}}, and {{target_barycentric[3].toFixed(4)}} {{comp_colors[3].name}}.
                    <v-divider class="border-opacity-0"></v-divider>
                    The estimated makeup of {{current.name}} is {{current_barycentric[0].toFixed(4)}} {{comp_colors[0].name}}, {{current_barycentric[1].toFixed(4)}} {{comp_colors[1].name}}, {{current_barycentric[2].toFixed(4)}} {{comp_colors[2].name}}, and {{current_barycentric[3].toFixed(4)}} {{comp_colors[3].name}}.
                    <v-divider class="border-opacity-0"></v-divider>
                </template>
            </v-card-text></v-card>
            <color-viewer :detail="DETAIL_LEVEL.PARTIAL" v-if="comp_colors.length >= 2" :color="target_closest_to_hull"></color-viewer>
            <color-viewer :detail="DETAIL_LEVEL.PARTIAL" v-if="comp_colors.length >= 2" :color="current_closest_to_hull"></color-viewer>
        </div>`
};
