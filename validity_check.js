import {plot} from "plot"
import {color_viewer} from "color_viewer"
import {DETAIL_LEVEL} from "color_detail"
import {Color} from "color"
import {vec3} from "glMatrix"

export var validity_check =
{
    data()
    {return{
        old_sp:0
    }},
    created()
    {
        this.DETAIL_LEVEL = DETAIL_LEVEL;
    },
    computed:
    {
        new_sp()
        {
            let sp_ratio = 51/this.old_sp;
            let tar_bary_1 = this.ratio_target_along_line;
            if(this.old_sp <= 0) return tar_bary_1;
            if(tar_bary_1 >= 1) return 51;
            if(tar_bary_1 <= 0) return 0;
            let tar_bary_0 = 1-tar_bary_1;
            let tar_bary_ratio = tar_bary_0/tar_bary_1;
            let cur_bary_1 = this.ratio_current_along_line;
            if(cur_bary_1 >= 1) return tar_bary_1;
            if(cur_bary_1 <= 0) return tar_bary_1;
            let cur_bary_0 = 1-cur_bary_1;
            let cur_bary_ratio = cur_bary_0/cur_bary_1;
            let x = sp_ratio/cur_bary_ratio;
            let new_ratio = x*tar_bary_ratio;
            return 51/new_ratio;
        },
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
        dist_from_target_to_first()
        {
            return this.point_to_point_distance(this.target,this.comp_colors[0])
        },
        dist_from_current_to_first()
        {
            return this.point_to_point_distance(this.current,this.comp_colors[0])
        },
        dist_from_target_to_line()
        {
            return this.point_to_line_distance(this.target,this.comp_colors[0],this.comp_colors[1]);
        },
        ratio_target_along_line()
        {
            let scalar = this.project_onto_line_scalar(this.target,this.comp_colors[0],this.comp_colors[1]);
            let dist = this.point_to_point_distance(this.comp_colors[0],this.comp_colors[1]);
            return scalar / dist;
        },
        color_target_nearest_line()
        {
            let nearest = this.project_onto_line(this.target,this.comp_colors[0],this.comp_colors[1]);
            return Color.from_xyz("Nearest to Line from Target",nearest);
        },
        dist_from_current_to_line()
        {
            return this.point_to_line_distance(this.current,this.comp_colors[0],this.comp_colors[1]);
        },
        ratio_current_along_line()
        {
            let scalar = this.project_onto_line_scalar(this.current,this.comp_colors[0],this.comp_colors[1]);
            let dist = this.point_to_point_distance(this.comp_colors[0],this.comp_colors[1]);
            return scalar / dist;
        },
        color_current_nearest_line()
        {
            let nearest = this.project_onto_line(this.current,this.comp_colors[0],this.comp_colors[1]);
            return Color.from_xyz("Nearest to Line from Current",nearest);
        },
        angle_against_line()
        {
            return this.angle_between_lines(this.target,this.current,this.comp_colors[0],this.comp_colors[1])
        }
    },
    methods:
    {
        point_to_point_distance(c1,c2)
        {
            return vec3.distance(c1.XYZ,c2.XYZ)
        },
        project_onto_line_scalar(c,l1,l2)
        {
            let a = vec3.create();
            vec3.subtract(a,c.XYZ,l1.XYZ);
            let b = vec3.create();
            vec3.subtract(b,l2.XYZ,l1.XYZ);
            vec3.normalize(b,b);
            let scalar_proj = vec3.dot(a,b);
            return scalar_proj;
        },
        project_onto_line(c,l1,l2)
        {
            let b = vec3.create();
            vec3.subtract(b,l2.XYZ,l1.XYZ);
            vec3.normalize(b,b);
            let scalar_proj = this.project_onto_line_scalar(c,l1,l2);
            let proj = vec3.create();
            vec3.scale(proj,b,scalar_proj);
            vec3.add(proj,proj,l1.XYZ);
            return proj;
        },
        point_to_line_distance(c,l1,l2)
        {
            let projection = {XYZ:this.project_onto_line(c,l1,l2)};
            return this.point_to_point_distance(c,projection);
        },
        angle_between_lines(a1,a2,b1,b2)
        {
            let a = vec3.create();
            vec3.subtract(a,a2.XYZ,a1.XYZ);
            let b = vec3.create();
            vec3.subtract(b,b2.XYZ,b1.XYZ);
            let t = vec3.angle(a,b);
            if(t>(Math.PI/2))
                t = Math.PI - t;
            return t;
        },
        rad_to_deg(t)
        {
            return t * (180/Math.PI);
        }
    },
    components:
    {
        "plot":plot,
        "color-viewer":color_viewer
    },
    template:/*html*/`
        <div class="mx-auto mt-10 mb-4" :style="{'max-width':'75dvw'}">
            <plot v-if="comp_colors.length >= 1"></plot>
            <v-card title="Check Validity" elevation="10"><v-card-text>
                <template v-if="comp_colors.length < 1">
                    <v-label>No Component Colors to Work With</v-label>
                </template>
                <template v-if="comp_colors.length == 1">
                    <v-label>Only One Component Color</v-label>
                    <v-divider color="primary"></v-divider>
                    {{target.name}} is {{dist_from_target_to_first.toFixed(4)}} away from {{comp_colors[0].name}}
                    <v-divider class="border-opacity-0"></v-divider>
                    {{current.name}} is {{dist_from_current_to_first.toFixed(4)}} away from {{comp_colors[0].name}}
                </template>
                <template v-if="comp_colors.length >= 2">
                    <v-label>First Two Component Colors</v-label>
                    <v-divider color="primary"></v-divider>
                    All colors made by mixing only {{comp_colors[0].name}} and {{comp_colors[1].name}} should exist on the line between them.
                    <v-divider class="border-opacity-0"></v-divider>
                    {{target.name}} is {{dist_from_target_to_line.toFixed(4)}} away from the line.
                    <v-divider class="border-opacity-0"></v-divider>
                    This is {{ratio_target_along_line.toFixed(4)}} along the line.
                    <v-divider class="border-opacity-0"></v-divider>
                    {{current.name}} is {{dist_from_current_to_line.toFixed(4)}} away from the line.
                    <v-divider class="border-opacity-0"></v-divider>
                    This is {{ratio_current_along_line.toFixed(4)}} along the line.
                    <v-divider class="border-opacity-0"></v-divider>
                    With only these two components, the line from {{target.name}} to {{current.name}} should be parallel to the line from {{comp_colors[0].name}} to {{comp_colors[1].name}}.
                    <v-divider class="border-opacity-0"></v-divider>
                    The angle between these lines is {{angle_against_line.toFixed(4)}} ({{rad_to_deg(angle_against_line).toFixed(4)}}&deg;).
                    <v-divider class="border-opacity-0"></v-divider>
                    <v-text-field type="number" :style="{'min-width':'12ch'}" :label="comp_colors[1].name+' SP'" v-model.number="old_sp"></v-text-field>
                    <v-text-field disabled type="number" :style="{'min-width':'12ch'}" label="New SP" v-model.number="new_sp"></v-text-field>
                    <v-divider class="border-opacity-0"></v-divider>
                </template>
                <template v-if="comp_colors.length > 2">
                    <v-label>More Components Not Yet Implemented</v-label>
                </template>
            </v-card-text></v-card>
            <color-viewer :detail="DETAIL_LEVEL.PARTIAL" v-if="comp_colors.length >= 2" :color="color_target_nearest_line"></color-viewer>
            <color-viewer :detail="DETAIL_LEVEL.PARTIAL" v-if="comp_colors.length >= 2" :color="color_current_nearest_line"></color-viewer>
        </div>`
};
